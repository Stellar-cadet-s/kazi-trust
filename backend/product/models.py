from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models
from django.utils import timezone
import secrets
import random

class UserManager(BaseUserManager):
    def create_user(self, email=None, password=None, **extra_fields):
        if 'phone_number' not in extra_fields:
            raise ValueError('Phone number is required')
        
        if email:
            email = self.normalize_email(email)
        
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)

class CustomUser(AbstractBaseUser):
    email = models.EmailField(unique=True, null=True, blank=True)
    phone_number = models.CharField(max_length=15, unique=True,null=True)
    first_name = models.CharField(max_length=50, blank=True, null=True)
    last_name = models.CharField(max_length=50, blank=True, null=True)
    user_type = models.CharField(
        max_length=20,
        choices=[
            ('employer', 'Employer'),
            ('employee', 'Employee'),
            ('admin', 'Admin')
        ],
        default='employer'
    )
    
    # Stellar account details
    stellar_account_id = models.CharField(max_length=56, blank=True, null=True)
    stellar_secret_key = models.CharField(max_length=56, blank=True, null=True)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    
    # Auto-generated PIN for USSD login
    ussd_pin = models.CharField(max_length=6, blank=True, null=True)
    pin_created_at = models.DateTimeField(null=True, blank=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['phone_number']
    
    objects = UserManager()

    def has_perm(self, perm, obj=None):
        return self.is_superuser

    def has_module_perms(self, app_label):
        return self.is_superuser
    
    def generate_ussd_pin(self):
        """Generate a 6-digit PIN for USSD login"""
        self.ussd_pin = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        self.pin_created_at = timezone.now()
        self.save()
        return self.ussd_pin
    
    def verify_ussd_pin(self, pin):
        """Verify the USSD PIN"""
        if self.ussd_pin == pin and self.pin_created_at:
            # PIN expires after 10 minutes
            time_diff = timezone.now() - self.pin_created_at
            return time_diff.total_seconds() < 600
        return False
    
    def get_full_name(self):
        """Get user's full name"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name:
            return self.first_name
        elif self.email:
            return self.email
        return self.phone_number
    
    def __str__(self):
        return self.phone_number

class USSDTransaction(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True, blank=True)
    session_id = models.CharField(max_length=100, unique=True)
    phone_number = models.CharField(max_length=15)
    text = models.TextField()
    stage = models.CharField(max_length=50, default='start')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.session_id} - {self.phone_number}"

class JobListing(models.Model):
    """Job listing created by employer"""
    employer = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='job_listings')
    title = models.CharField(max_length=200)
    description = models.TextField()
    budget = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(
        max_length=20,
        choices=[
            ('open', 'Open'),
            ('assigned', 'Assigned'),
            ('in_progress', 'In Progress'),
            ('completed', 'Completed'),
            ('cancelled', 'Cancelled')
        ],
        default='open'
    )
    employee = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, related_name='assigned_jobs', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    assigned_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Escrow contract reference
    escrow_contract_id = models.CharField(max_length=100, blank=True, null=True)
    
    def __str__(self):
        return f"{self.title} - {self.status}"

class EscrowContract(models.Model):
    """Stellar escrow contract for holding funds"""
    job_listing = models.OneToOneField(JobListing, on_delete=models.CASCADE, related_name='escrow_contract')
    contract_id = models.CharField(max_length=100, unique=True)  # Stellar contract ID
    employer = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='escrow_contracts')
    employee = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending_deposit', 'Pending Deposit'),
            ('funded', 'Funded'),
            ('in_progress', 'In Progress'),
            ('completed', 'Completed'),
            ('released', 'Released'),
            ('cancelled', 'Cancelled')
        ],
        default='pending_deposit'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    funded_at = models.DateTimeField(null=True, blank=True)
    released_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Escrow {self.contract_id} - {self.status}"

class MpesaDeposit(models.Model):
    """M-Pesa deposit transactions"""
    escrow_contract = models.ForeignKey(EscrowContract, on_delete=models.CASCADE, related_name='mpesa_deposits')
    transaction_reference = models.CharField(max_length=100, unique=True)
    phone_number = models.CharField(max_length=15)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('completed', 'Completed'),
            ('failed', 'Failed')
        ],
        default='pending'
    )
    mpesa_receipt = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"M-Pesa {self.transaction_reference} - {self.amount}"

class Task(models.Model):
    """Legacy Task model - keeping for backward compatibility"""
    client = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='client_tasks')
    employee = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='employee_tasks', null=True, blank=True)
    title = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('assigned', 'Assigned'),
            ('in_progress', 'In Progress'),
            ('completed', 'Completed'),
            ('verified', 'Verified')
        ],
        default='pending'
    )
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    employee_rating = models.IntegerField(null=True, blank=True)
    client_feedback = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.title} - {self.status}"

class Payment(models.Model):
    """Legacy Payment model"""
    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reference = models.CharField(max_length=100, unique=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('completed', 'Completed'),
            ('failed', 'Failed')
        ],
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.reference} - {self.amount}"

class MobileMoneyPayout(models.Model):
    """Mobile money payout to employee after job completion"""
    escrow_contract = models.OneToOneField(EscrowContract, on_delete=models.CASCADE, related_name='payout')
    employee = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    phone_number = models.CharField(max_length=15)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_reference = models.CharField(max_length=100, unique=True, blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('processing', 'Processing'),
            ('completed', 'Completed'),
            ('failed', 'Failed')
        ],
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    failure_reason = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"Payout {self.transaction_reference} - {self.amount}"
