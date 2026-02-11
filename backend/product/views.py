from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from django.utils import timezone
from django.shortcuts import get_object_or_404
import uuid
import logging

from .models import CustomUser, JobListing, EscrowContract, MpesaDeposit, MobileMoneyPayout
from .serializers import (
    UserRegistrationSerializer, EmailPasswordLoginSerializer,
    JobListingSerializer, JobListingCreateSerializer, EscrowContractSerializer
)
from .stellar_integration import get_stellar_client
from .mobile_money_integration import get_intersend_client
from rest_framework_simplejwt.tokens import RefreshToken

logger = logging.getLogger(__name__)


# ==================== USER REGISTRATION & AUTHENTICATION ====================

class UserRegistrationView(APIView):
    """Register user with phone number and password"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                "message": "User registered successfully",
                "user": {
                    "id": user.id,
                    "phone_number": user.phone_number,
                    "email": user.email,
                    "user_type": user.user_type
                },
                "access": str(refresh.access_token),
                "refresh": str(refresh)
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLoginView(APIView):
    """Login with email/phone and password"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = EmailPasswordLoginSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            
            return Response({
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": user.id,
                    "phone_number": user.phone_number,
                    "email": user.email,
                    "user_type": user.user_type
                }
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==================== USSD REGISTRATION CALLBACK ====================

@api_view(['POST'])
@permission_classes([AllowAny])
def ussd_registration_callback(request):
    """
    Callback endpoint for USSD registration
    Called when user completes registration via USSD
    """
    try:
        phone_number = request.data.get('phone_number')
        user_type = request.data.get('user_type', 'employer')
        
        if not phone_number:
            return Response(
                {"error": "Phone number is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user already exists
        user, created = CustomUser.objects.get_or_create(
            phone_number=phone_number,
            defaults={
                'user_type': user_type,
                'is_active': True
            }
        )
        
        if created:
            # Generate USSD PIN for the user
            pin = user.generate_ussd_pin()
            
            return Response({
                "message": "User registered via USSD",
                "user_id": user.id,
                "phone_number": user.phone_number,
                "ussd_pin": pin,
                "user_type": user.user_type
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                "message": "User already exists",
                "user_id": user.id,
                "phone_number": user.phone_number,
                "ussd_pin": user.ussd_pin
            }, status=status.HTTP_200_OK)
            
    except Exception as e:
        logger.error(f"USSD registration callback error: {str(e)}")
        return Response(
            {"error": "Registration failed"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ==================== JOB LISTING ENDPOINTS ====================

class JobListingListCreateView(APIView):
    """List all job listings or create a new one"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get all job listings"""
        user_type = request.user.user_type
        
        if user_type == 'employer':
            # Employers see their own listings
            listings = JobListing.objects.filter(employer=request.user)
        elif user_type == 'employee':
            # Employees see open listings
            listings = JobListing.objects.filter(status='open')
        else:
            # Admin sees all
            listings = JobListing.objects.all()
        
        serializer = JobListingSerializer(listings, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Create a new job listing (employer only)"""
        if request.user.user_type != 'employer':
            return Response(
                {"error": "Only employers can create job listings"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = JobListingCreateSerializer(data=request.data)
        
        if serializer.is_valid():
            job_listing = serializer.save(employer=request.user)
            
            # Create escrow contract on Stellar
            stellar_client = get_stellar_client()
            employer_account = request.user.stellar_account_id or None
            
            # Create Stellar escrow contract
            stellar_result = stellar_client.create_escrow_contract(
                employer_account=employer_account or request.user.phone_number,  # Fallback to phone if no Stellar account
                amount=float(job_listing.budget),
                asset_code='XLM',
                job_id=str(job_listing.id)
            )
            
            if stellar_result:
                contract_id = stellar_result.get('contract_id', f"ESCROW_{uuid.uuid4().hex[:16].upper()}")
            else:
                # Fallback to local contract ID if Stellar service unavailable
                contract_id = f"ESCROW_{uuid.uuid4().hex[:16].upper()}"
                logger.warning(f"Stellar contract creation failed, using local ID: {contract_id}")
            
            # Create escrow contract record
            escrow_contract = EscrowContract.objects.create(
                job_listing=job_listing,
                contract_id=contract_id,
                employer=request.user,
                amount=job_listing.budget,
                status='pending_deposit'
            )
            
            job_listing.escrow_contract_id = contract_id
            job_listing.save()
            
            # Return full job listing with escrow info
            response_serializer = JobListingSerializer(job_listing)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class JobListingDetailView(APIView):
    """Get, update, or delete a specific job listing"""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        """Get job listing by ID"""
        job_listing = get_object_or_404(JobListing, pk=pk)
        
        # Check permissions
        if request.user.user_type == 'employer' and job_listing.employer != request.user:
            return Response(
                {"error": "You don't have permission to view this listing"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = JobListingSerializer(job_listing)
        return Response(serializer.data)

    def patch(self, request, pk):
        """Update job listing status (assign employee, etc.)"""
        job_listing = get_object_or_404(JobListing, pk=pk)
        
        # Only employer can update their own listings
        if job_listing.employer != request.user:
            return Response(
                {"error": "You don't have permission to update this listing"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        employee_id = request.data.get('employee_id')
        new_status = request.data.get('status')
        
        # Assign employee
        if employee_id and job_listing.status == 'open':
            try:
                employee = CustomUser.objects.get(id=employee_id, user_type='employee')
                job_listing.employee = employee
                job_listing.status = 'assigned'
                job_listing.assigned_at = timezone.now()
                job_listing.save()
                
                # Update escrow contract
                if job_listing.escrow_contract:
                    escrow_contract = job_listing.escrow_contract
                    escrow_contract.employee = employee
                    escrow_contract.status = 'in_progress'
                    escrow_contract.save()
                
                serializer = JobListingSerializer(job_listing)
                return Response(serializer.data)
            except CustomUser.DoesNotExist:
                return Response(
                    {"error": "Employee not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Update status
        if new_status:
            job_listing.status = new_status
            if new_status == 'completed':
                job_listing.completed_at = timezone.now()
            job_listing.save()
            
            serializer = JobListingSerializer(job_listing)
            return Response(serializer.data)
        
        return Response(
            {"error": "No valid update provided"},
            status=status.HTTP_400_BAD_REQUEST
        )


# ==================== M-PESA DEPOSIT CALLBACK ====================

@api_view(['POST'])
@permission_classes([AllowAny])
def mpesa_deposit_callback(request):
    """
    Callback endpoint for M-Pesa deposits
    Called by M-Pesa when a deposit is made
    Expected payload from M-Pesa:
    {
        "TransactionType": "Pay Bill",
        "TransID": "RKTQDM7W6S",
        "TransTime": "20191122063845",
        "TransAmount": "10.00",
        "BusinessShortCode": "174379",
        "BillRefNumber": "ESCROW_XXXXX",
        "InvoiceNumber": "",
        "OrgAccountBalance": "19.00",
        "ThirdPartyTransID": "",
        "MSISDN": "254708374149",
        "FirstName": "John",
        "MiddleName": "Doe",
        "LastName": "Smith"
    }
    """
    try:
        # Extract M-Pesa transaction data
        transaction_id = request.data.get('TransID')
        amount = float(request.data.get('TransAmount', 0))
        phone_number = request.data.get('MSISDN', '').replace('254', '0', 1)  # Format phone number
        bill_ref = request.data.get('BillRefNumber', '')
        
        logger.info(f"M-Pesa deposit callback received: {transaction_id}, Amount: {amount}, Ref: {bill_ref}")
        
        # Extract escrow contract ID from bill reference
        # Format: ESCROW_XXXXX or just the contract ID
        if bill_ref.startswith('ESCROW_'):
            contract_id = bill_ref
        else:
            # Try to find by job listing ID if bill_ref is a number
            try:
                job_listing = JobListing.objects.get(id=int(bill_ref))
                contract_id = job_listing.escrow_contract_id
            except (JobListing.DoesNotExist, ValueError):
                return Response(
                    {"error": "Invalid bill reference"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Find escrow contract
        try:
            escrow_contract = EscrowContract.objects.get(contract_id=contract_id)
        except EscrowContract.DoesNotExist:
            return Response(
                {"error": "Escrow contract not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Create or update M-Pesa deposit record
        mpesa_deposit, created = MpesaDeposit.objects.get_or_create(
            transaction_reference=transaction_id,
            defaults={
                'escrow_contract': escrow_contract,
                'phone_number': phone_number,
                'amount': amount,
                'mpesa_receipt': transaction_id,
                'status': 'completed',
                'completed_at': timezone.now()
            }
        )
        
        if not created:
            # Update existing deposit
            mpesa_deposit.status = 'completed'
            mpesa_deposit.completed_at = timezone.now()
            mpesa_deposit.save()
        
        # Fund the Stellar escrow contract
        stellar_client = get_stellar_client()
        stellar_funded = stellar_client.fund_escrow_contract(
            contract_id=contract_id,
            amount=amount,
            transaction_hash=transaction_id
        )
        
        if stellar_funded:
            # Update escrow contract status
            escrow_contract.status = 'funded'
            escrow_contract.funded_at = timezone.now()
            escrow_contract.save()
            
            # Update job listing escrow status
            escrow_contract.job_listing.escrow_contract_id = contract_id
            escrow_contract.job_listing.save()
        else:
            logger.warning(f"Stellar escrow funding failed for contract: {contract_id}")
            # Still update local status but mark as warning
            escrow_contract.status = 'funded'
            escrow_contract.funded_at = timezone.now()
            escrow_contract.save()
        
        logger.info(f"Escrow contract {contract_id} funded successfully with {amount}")
        
        return Response({
            "message": "Deposit processed successfully",
            "contract_id": contract_id,
            "amount": amount,
            "status": "funded"
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"M-Pesa deposit callback error: {str(e)}")
        return Response(
            {"error": "Failed to process deposit"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ==================== WORK COMPLETION & ESCROW RELEASE ====================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_work(request, job_id):
    """
    Mark work as complete and release escrow funds to employee
    This triggers:
    1. Update job status to completed
    2. Update escrow contract status
    3. Call Stellar contract to release funds
    4. Trigger mobile money payout to employee
    """
    try:
        job_listing = get_object_or_404(JobListing, pk=job_id)
        
        # Only employer can mark work as complete
        if job_listing.employer != request.user:
            return Response(
                {"error": "Only the employer can mark work as complete"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if job_listing.status != 'in_progress':
            return Response(
                {"error": f"Job must be in progress. Current status: {job_listing.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update job listing status
        job_listing.status = 'completed'
        job_listing.completed_at = timezone.now()
        job_listing.save()
        
        # Get escrow contract
        escrow_contract = job_listing.escrow_contract
        
        if not escrow_contract:
            return Response(
                {"error": "Escrow contract not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if escrow_contract.status != 'funded':
            return Response(
                {"error": f"Escrow not funded. Current status: {escrow_contract.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update escrow contract status
        escrow_contract.status = 'completed'
        escrow_contract.save()
        
        # Call Stellar contract to release funds
        # This would typically call your Stellar Rust contract
        # For now, we'll simulate the contract callback
        stellar_release_success = release_stellar_escrow(escrow_contract)
        
        if not stellar_release_success:
            return Response(
                {"error": "Failed to release funds from Stellar contract"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Update escrow to released
        escrow_contract.status = 'released'
        escrow_contract.released_at = timezone.now()
        escrow_contract.save()
        
        # Create mobile money payout record
        payout = MobileMoneyPayout.objects.create(
            escrow_contract=escrow_contract,
            employee=job_listing.employee,
            phone_number=job_listing.employee.phone_number,
            amount=escrow_contract.amount,
            status='pending'
        )
        
        # Trigger mobile money payout (this would call Intersend API)
        payout_success = trigger_mobile_money_payout(payout)
        
        if payout_success:
            payout.status = 'completed'
            payout.completed_at = timezone.now()
            payout.save()
        else:
            payout.status = 'failed'
            payout.failure_reason = "Failed to process mobile money payout"
            payout.save()
        
        return Response({
            "message": "Work completed and funds released",
            "job_id": job_listing.id,
            "escrow_status": escrow_contract.status,
            "payout_status": payout.status,
            "amount": str(escrow_contract.amount)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Work completion error: {str(e)}")
        return Response(
            {"error": "Failed to complete work"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ==================== HELPER FUNCTIONS ====================

def release_stellar_escrow(escrow_contract):
    """
    Call Stellar Rust contract to release escrow funds
    """
    try:
        stellar_client = get_stellar_client()
        
        # Get employee's Stellar account
        employee_account = escrow_contract.employee.stellar_account_id if escrow_contract.employee else None
        
        if not employee_account:
            logger.error(f"No Stellar account for employee: {escrow_contract.employee}")
            return False
        
        # Release escrow funds
        success = stellar_client.release_escrow_contract(
            contract_id=escrow_contract.contract_id,
            employee_account=employee_account,
            amount=float(escrow_contract.amount)
        )
        
        if success:
            logger.info(f"Stellar escrow released: {escrow_contract.contract_id} -> {employee_account}")
        
        return success
        
    except Exception as e:
        logger.error(f"Stellar escrow release error: {str(e)}")
        return False


def trigger_mobile_money_payout(payout):
    """
    Trigger mobile money payout via Intersend API
    """
    try:
        intersend_client = get_intersend_client()
        
        # Send mobile money
        result = intersend_client.send_mobile_money(
            phone_number=payout.phone_number,
            amount=float(payout.amount),
            currency='KES',
            reference=payout.transaction_reference
        )
        
        if result:
            payout.transaction_reference = result.get('transaction_id', payout.transaction_reference)
            payout.save()
            logger.info(f"Mobile money payout initiated: {payout.transaction_reference}")
            return True
        else:
            logger.error(f"Failed to initiate mobile money payout")
            return False
        
    except Exception as e:
        logger.error(f"Mobile money payout error: {str(e)}")
        return False
