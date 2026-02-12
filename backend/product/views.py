from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.conf import settings
from django.http import HttpResponse, HttpResponseBadRequest
import hmac
import hashlib
import json
import uuid
import logging

from .models import CustomUser, JobListing, EscrowContract, MpesaDeposit, MobileMoneyPayout, JobApplication, PaystackDeposit, JobMessage
from .serializers import (
    UserRegistrationSerializer, EmailPasswordLoginSerializer,
    JobListingSerializer, JobListingCreateSerializer, EscrowContractSerializer,
    JobApplicationSerializer,
)
from .stellar_integration import get_stellar_client
from .mobile_money_integration import get_intersend_client
from rest_framework_simplejwt.tokens import RefreshToken

logger = logging.getLogger(__name__)


def get_employee_work_history(employee):
    """Return verified work history for an employee (completed jobs) for employer trust."""
    completed = JobListing.objects.filter(
        employee=employee, status='completed'
    ).select_related('employer').order_by('-completed_at')
    out = []
    for j in completed:
        start = j.assigned_at or j.created_at
        end = j.completed_at
        duration_days = 0
        if start and end:
            delta = end - start
            duration_days = getattr(delta, 'days', 0) if hasattr(delta, 'days') else 0
        out.append({
            "job_title": j.title,
            "employer_name": j.employer.get_full_name() if j.employer else None,
            "completed_at": j.completed_at.isoformat() if j.completed_at else None,
            "duration_days": duration_days,
            "work_summary": j.work_summary or None,
        })
    return out


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
                    "first_name": user.first_name or "",
                    "last_name": user.last_name or "",
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
                    "first_name": user.first_name or "",
                    "last_name": user.last_name or "",
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
            # Employees see open listings + jobs assigned to them
            listings = JobListing.objects.filter(
                Q(status='open') | Q(employee=request.user)
            ).distinct()
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
        
        applicant_id = request.data.get('applicant_id')
        employee_id = request.data.get('employee_id')
        new_status = request.data.get('status')
        
        # Assign from applicant (preferred)
        if applicant_id and job_listing.status == 'open':
            try:
                application = JobApplication.objects.get(
                    id=applicant_id,
                    job_listing=job_listing,
                    status='pending'
                )
                employee = application.employee
                application.status = 'accepted'
                application.save()
                job_listing.employee = employee
                job_listing.status = 'assigned'
                job_listing.assigned_at = timezone.now()
                job_listing.save()
                if job_listing.escrow_contract:
                    ec = job_listing.escrow_contract
                    ec.employee = employee
                    ec.status = 'in_progress'
                    ec.save()
                serializer = JobListingSerializer(job_listing)
                return Response(serializer.data)
            except JobApplication.DoesNotExist:
                return Response(
                    {"error": "Applicant not found or already assigned"},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Fallback: assign by employee_id (e.g. from dropdown of applicants)
        if employee_id and job_listing.status == 'open':
            try:
                application = JobApplication.objects.filter(
                    job_listing=job_listing,
                    employee_id=employee_id,
                    status='pending'
                ).first()
                employee = CustomUser.objects.get(id=employee_id, user_type='employee')
                if application:
                    application.status = 'accepted'
                    application.save()
                job_listing.employee = employee
                job_listing.status = 'assigned'
                job_listing.assigned_at = timezone.now()
                job_listing.save()
                if job_listing.escrow_contract:
                    ec = job_listing.escrow_contract
                    ec.employee = employee
                    ec.status = 'in_progress'
                    ec.save()
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


# ==================== PAYSTACK DEPOSIT CALLBACK ====================

def _paystack_verify(raw_body, signature):
    secret = getattr(settings, 'PAYSTACK_SECRET_KEY', '') or getattr(settings, 'PAYSTACK_SECRET', '')
    if not secret:
        return True
    expected = hmac.new(secret.encode('utf-8'), raw_body, hashlib.sha512).hexdigest()
    return hmac.compare_digest(expected, signature)


@api_view(['POST'])
@permission_classes([AllowAny])
def paystack_deposit_callback(request):
    """Paystack webhook: on charge.success credit escrow. Frontend uses ref=escrow_contract_id."""
    raw_body = request.body
    sig = request.headers.get('x-paystack-signature', '')
    if not _paystack_verify(raw_body, sig):
        return HttpResponseBadRequest(b"Invalid signature")
    try:
        payload = json.loads(raw_body.decode('utf-8'))
    except Exception:
        return HttpResponseBadRequest(b"Invalid JSON")
    if payload.get('event') != 'charge.success':
        return HttpResponse(status=200)
    data = payload.get('data') or {}
    reference = data.get('reference') or data.get('id')
    if not reference:
        return HttpResponse(status=200)
    amount_kobo = int(data.get('amount', 0))
    amount_main = amount_kobo / 100.0
    currency = (data.get('currency') or 'NGN').upper()
    customer_email = (data.get('customer') or {}).get('email') or data.get('customer_email')
    contract_id = reference if str(reference).startswith('ESCROW_') else None
    if not contract_id:
        try:
            job = JobListing.objects.get(id=int(reference))
            contract_id = job.escrow_contract_id
        except (JobListing.DoesNotExist, ValueError):
            return HttpResponse(status=200)
    try:
        escrow_contract = EscrowContract.objects.get(contract_id=contract_id)
    except EscrowContract.DoesNotExist:
        return HttpResponse(status=200)
    PaystackDeposit.objects.get_or_create(
        transaction_reference=str(reference),
        defaults={
            'escrow_contract': escrow_contract,
            'paystack_event_id': payload.get('id'),
            'email': customer_email,
            'amount': amount_main,
            'amount_in_kobo': amount_kobo,
            'currency': currency,
            'status': 'completed',
            'completed_at': timezone.now(),
        },
    )
    get_stellar_client().fund_escrow_contract(contract_id=contract_id, amount=amount_main, transaction_hash=str(reference))
    escrow_contract.status = 'funded'
    escrow_contract.funded_at = timezone.now()
    escrow_contract.save()
    if escrow_contract.job_listing_id:
        escrow_contract.job_listing.escrow_contract_id = contract_id
        escrow_contract.job_listing.save(update_fields=['escrow_contract_id'])
    return HttpResponse(status=200)


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
        
        if job_listing.status not in ('in_progress', 'assigned'):
            return Response(
                {"error": f"Job must be in progress or assigned. Current status: {job_listing.status}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Optional: tasks/work summary for verified work history (visible to other employers)
        work_summary = (request.data.get('work_summary') or '').strip() or None
        if work_summary:
            job_listing.work_summary = work_summary
        
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
        
        # Employee must have M-Pesa (phone) number for payout
        payout_phone = (job_listing.employee.phone_number or "").strip()
        if not payout_phone:
            return Response(
                {"error": "Worker has no M-Pesa number. They must set a phone number for payment."},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Normalize for payout (254...)
        if payout_phone.startswith('0'):
            payout_phone = '254' + payout_phone[1:]
        elif not payout_phone.startswith('254'):
            payout_phone = '254' + payout_phone

        # Update escrow to released
        escrow_contract.status = 'released'
        escrow_contract.released_at = timezone.now()
        escrow_contract.save()
        
        # Create mobile money payout record (use normalized payout_phone)
        payout = MobileMoneyPayout.objects.create(
            escrow_contract=escrow_contract,
            employee=job_listing.employee,
            phone_number=payout_phone,
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


# ==================== APPLY TO JOB ====================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def apply_to_job(request, job_id):
    """Worker applies to a job - creates application; employer later assigns from applicants."""
    job_listing = get_object_or_404(JobListing, pk=job_id)
    if request.user.user_type != 'employee':
        return Response({"error": "Only workers can apply"}, status=status.HTTP_403_FORBIDDEN)
    if job_listing.status != 'open':
        return Response({"error": "Job is not open for applications"}, status=status.HTTP_400_BAD_REQUEST)
    app, created = JobApplication.objects.get_or_create(
        job_listing=job_listing,
        employee=request.user,
        defaults={'status': 'pending'}
    )
    if not created:
        return Response({"message": "Already applied", "application_id": app.id}, status=status.HTTP_200_OK)
    return Response(
        {"message": "Application submitted", "application_id": app.id},
        status=status.HTTP_201_CREATED
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def withdraw_application(request, job_id):
    """Worker withdraws their pending application for a job."""
    job_listing = get_object_or_404(JobListing, pk=job_id)
    if request.user.user_type != 'employee':
        return Response({"error": "Only workers can withdraw applications"}, status=status.HTTP_403_FORBIDDEN)
    app = JobApplication.objects.filter(
        job_listing=job_listing,
        employee=request.user,
        status='pending'
    ).first()
    if not app:
        return Response(
            {"error": "No pending application to withdraw"},
            status=status.HTTP_404_NOT_FOUND
        )
    app.delete()
    return Response({"message": "Application withdrawn"}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_applications(request):
    """List current user's job applications (for workers to see applied jobs and withdraw)."""
    if request.user.user_type != 'employee':
        return Response({"error": "Workers only"}, status=status.HTTP_403_FORBIDDEN)
    apps = JobApplication.objects.filter(employee=request.user).select_related('job_listing')
    data = [{"job_id": a.job_listing_id, "application_id": a.id, "status": a.status} for a in apps]
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def employee_work_history(request):
    """Verifiable work history for current employee (completed jobs)."""
    if request.user.user_type != 'employee':
        return Response({"error": "Workers only"}, status=status.HTTP_403_FORBIDDEN)
    jobs = JobListing.objects.filter(employee=request.user, status='completed').select_related('employer').order_by('-completed_at')
    out = []
    for j in jobs:
        start = j.assigned_at or j.created_at
        end = j.completed_at
        duration_days = 0
        if start and end:
            delta = end - start
            duration_days = getattr(delta, 'days', 0)
        out.append({
            "job_id": j.id,
            "job_title": j.title,
            "employer_name": j.employer.get_full_name() if j.employer else None,
            "completed_at": j.completed_at.isoformat() if j.completed_at else None,
            "duration_days": duration_days,
            "work_summary": j.work_summary,
            "budget": str(j.budget),
        })
    return Response(out)


# ==================== JOB CHAT (MESSAGES) ====================

def _can_access_job_chat(user, job_listing):
    """Only employer or assigned employee can chat for this job."""
    if job_listing.employer_id == user.id:
        return True
    if job_listing.employee_id == user.id:
        return True
    return False


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def job_messages(request, job_id):
    """List or send messages for a job (employer and assigned employee only)."""
    job_listing = get_object_or_404(JobListing, pk=job_id)
    if not _can_access_job_chat(request.user, job_listing):
        return Response({"error": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)
    if request.method == 'GET':
        messages = JobMessage.objects.filter(job_listing=job_listing).select_related('sender').order_by('created_at')
        data = [
            {
                "id": m.id,
                "sender_id": m.sender_id,
                "sender_name": m.sender.get_full_name() or str(m.sender),
                "is_mine": m.sender_id == request.user.id,
                "text": m.text,
                "created_at": m.created_at.isoformat(),
            }
            for m in messages
        ]
        return Response(data)
    text = (request.data.get('text') or '').strip()
    if not text:
        return Response({"error": "Message text required"}, status=status.HTTP_400_BAD_REQUEST)
    msg = JobMessage.objects.create(job_listing=job_listing, sender=request.user, text=text)
    return Response({
        "id": msg.id,
        "sender_id": msg.sender_id,
        "sender_name": msg.sender.get_full_name() or str(msg.sender),
        "is_mine": True,
        "text": msg.text,
        "created_at": msg.created_at.isoformat(),
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_chats(request):
    """List jobs where current user can chat (employer or assigned employee; only jobs with assigned worker)."""
    from django.db.models import Q
    jobs = JobListing.objects.filter(
        Q(employer=request.user) | Q(employee=request.user)
    ).exclude(employee=None).exclude(status='cancelled').select_related('employer', 'employee').order_by('-updated_at')
    out = []
    for j in jobs:
        other = j.employee if j.employer_id == request.user.id else j.employer
        out.append({
            "job_id": j.id,
            "job_title": j.title,
            "other_name": other.get_full_name() if other else "—",
            "status": j.status,
        })
    return Response(out)


# ==================== EMPLOYER WORKERS OVERVIEW ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def employer_workers_overview(request):
    """List hired workers (with duration) and open jobs with applicant counts for Find Workers page."""
    if request.user.user_type != 'employer':
        return Response({"error": "Employer only"}, status=status.HTTP_403_FORBIDDEN)
    from django.utils import timezone as tz
    now = tz.now()
    hired = []
    for job in JobListing.objects.filter(employer=request.user).exclude(employee=None).select_related('employee'):
        start = job.assigned_at or job.created_at
        end = job.completed_at or now
        if start:
            delta = (end - start).days if hasattr(end - start, 'days') else 0
            hired.append({
                "job_id": job.id,
                "job_title": job.title,
                "employee_id": job.employee.id,
                "employee_name": job.employee.get_full_name(),
                "employee_phone": job.employee.phone_number,
                "assigned_at": job.assigned_at.isoformat() if job.assigned_at else None,
                "completed_at": job.completed_at.isoformat() if job.completed_at else None,
                "status": job.status,
                "duration_days": delta,
            })
    open_jobs = []
    for job in JobListing.objects.filter(employer=request.user, status='open'):
        try:
            applications = JobApplication.objects.filter(
                job_listing=job, status='pending'
            ).select_related('employee')
            count = applications.count()
            applicants = [
                {
                    "id": a.id,
                    "employee_id": a.employee_id,
                    "employee_name": a.employee.get_full_name() or "Worker",
                    "employee_phone": a.employee.phone_number or "",
                    "work_history": get_employee_work_history(a.employee),
                }
                for a in applications
            ]
        except Exception:
            count = 0
            applicants = []
        open_jobs.append({
            "job_id": job.id,
            "job_title": job.title,
            "applicant_count": count,
            "applicants": applicants,
        })
    return Response({"hired_workers": hired, "open_jobs_with_applicants": open_jobs})


# ==================== JOB APPLICANTS ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def job_applicants(request, job_id):
    """List applicants for a job (employer only)."""
    job_listing = get_object_or_404(JobListing, pk=job_id)
    if job_listing.employer != request.user:
        return Response({"error": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)
    applications = JobApplication.objects.filter(job_listing=job_listing, status='pending').select_related('employee')
    serializer = JobApplicationSerializer(applications, many=True)
    data = list(serializer.data)
    for i, app in enumerate(applications):
        data[i]["work_history"] = get_employee_work_history(app.employee)
    return Response(data)


# ==================== INITIATE PAYSTACK (DEPOSIT) ====================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initiate_paystack(request, job_id):
    """Return Paystack ref and amount for frontend to open Paystack widget. Employer funds escrow."""
    job_listing = get_object_or_404(JobListing, pk=job_id)
    if job_listing.employer != request.user:
        return Response({"error": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)
    escrow = get_object_or_404(EscrowContract, job_listing=job_listing)
    contract_id = escrow.contract_id or job_listing.escrow_contract_id
    if not contract_id:
        return Response({"error": "No escrow contract"}, status=status.HTTP_400_BAD_REQUEST)
    amount = float(escrow.amount)
    amount_kobo = int(round(amount * 100))
    email = request.user.email or (request.user.phone_number + '@trustwork.placeholder')
    return Response({
        "reference": contract_id,
        "amount_kobo": amount_kobo,
        "amount_kes": amount,
        "currency": "KES",
        "email": email,
        "job_id": job_listing.id,
        "job_title": job_listing.title,
    })


# ==================== JOB ESCROW INFO ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def job_escrow(request, job_id):
    """Escrow balance and status for a job (employer or assigned worker)."""
    job_listing = get_object_or_404(JobListing, pk=job_id)
    if job_listing.employer != request.user and job_listing.employee != request.user:
        return Response({"error": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)
    try:
        escrow = EscrowContract.objects.get(job_listing=job_listing)
    except EscrowContract.DoesNotExist:
        return Response({
            "job_id": job_id,
            "job_title": getattr(job_listing, 'title', ''),
            "contract_id": "",
            "amount_held": "0",
            "amount_held_kes": "0",
            "amount_held_xlm": "0",
            "status": "pending_deposit",
            "funded_at": None,
            "released_at": None,
            "when_release": None,
        })
    amount = str(escrow.amount)
    return Response({
        "job_id": job_id,
        "job_title": job_listing.title,
        "contract_id": escrow.contract_id,
        "amount_held": amount,
        "amount_held_kes": amount,
        "amount_held_xlm": amount,
        "status": escrow.status,
        "funded_at": escrow.funded_at.isoformat() if escrow.funded_at else None,
        "released_at": escrow.released_at.isoformat() if escrow.released_at else None,
        "when_release": "When employer marks work done" if escrow.status == "funded" else (escrow.released_at.isoformat() if escrow.released_at else None),
    })


# ==================== TRANSACTIONS HISTORY ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def transactions(request):
    """List deposits and payouts for current user."""
    user = request.user
    out = []
    if user.user_type == 'employer':
        for ec in EscrowContract.objects.filter(employer=user).select_related('job_listing'):
            job = ec.job_listing
            for dep in MpesaDeposit.objects.filter(escrow_contract=ec):
                out.append({
                    "type": "deposit",
                    "id": dep.id,
                    "job_id": job.id,
                    "job_title": job.title,
                    "amount": str(dep.amount),
                    "currency": "KES",
                    "reference": dep.transaction_reference,
                    "status": dep.status,
                    "created_at": dep.created_at.isoformat(),
                    "completed_at": dep.completed_at.isoformat() if dep.completed_at else None,
                })
            for dep in PaystackDeposit.objects.filter(escrow_contract=ec):
                    out.append({
                        "type": "deposit",
                        "id": dep.id,
                        "job_id": job.id,
                        "job_title": job.title,
                        "amount": str(dep.amount),
                        "currency": dep.currency,
                        "reference": dep.transaction_reference,
                        "status": dep.status,
                        "created_at": dep.created_at.isoformat(),
                        "completed_at": dep.completed_at.isoformat() if dep.completed_at else None,
                    })
    if user.user_type == 'employee':
        for payout in MobileMoneyPayout.objects.filter(employee=user).select_related('escrow_contract'):
            ec = payout.escrow_contract
            job = ec.job_listing
            out.append({
                "type": "payout",
                "id": payout.id,
                "job_id": job.id,
                "job_title": job.title,
                "amount": str(payout.amount),
                "currency": "KES",
                "reference": payout.transaction_reference or "",
                "status": payout.status,
                "created_at": payout.created_at.isoformat(),
                "completed_at": payout.completed_at.isoformat() if payout.completed_at else None,
            })
    out.sort(key=lambda x: x['created_at'], reverse=True)
    return Response(out)


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
            logger.warning(f"No Stellar account for employee; skipping on-chain release, payout via mobile money only")
            return True  # Still allow mobile money payout
        
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
