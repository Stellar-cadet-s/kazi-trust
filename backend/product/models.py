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
    phone_number = models.CharField(max_length=15, unique=True)
    first_name = models.CharField(max_length=50, blank=True, null=True)
    last_name = models.CharField(max_length=50, blank=True, null=True)
    user_type = models.CharField(
        max_length=20,
        choices=[
            ('client', 'Client'),
            ('employee', 'Employee'),
            ('admin', 'Admin')
        ],
        default='client'
    )
    
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

class Task(models.Model):
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
