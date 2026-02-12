# serializers.py
from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUser as User, JobListing, EscrowContract, JobApplication

class EmailPasswordLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    phone_number = serializers.CharField(required=False)
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get("email")
        phone_number = data.get("phone_number")
        password = data.get("password")

        if not password:
            raise serializers.ValidationError("Password is required.")
        
        if not email and not phone_number:
            raise serializers.ValidationError("Either email or phone number is required.")

        # Try email first, then phone number
        user = None
        if email:
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                pass
        
        if not user and phone_number:
            try:
                user = User.objects.get(phone_number=phone_number)
            except User.DoesNotExist:
                pass
        
        if not user:
            raise serializers.ValidationError("Invalid credentials.")
        
        if not user.check_password(password):
            raise serializers.ValidationError("Invalid credentials.")
        
        if not user.is_active:
            raise serializers.ValidationError("User is inactive.")
        
        data['user'] = user
        return data

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    phone_number = serializers.CharField(required=True)
    user_type = serializers.ChoiceField(choices=['employer', 'employee'], default='employer')

    class Meta:
        model = User
        fields = ('email', 'phone_number', 'password', 'first_name', 'last_name', 'user_type')

    def validate_phone_number(self, value):
        if User.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError("A user with this phone number already exists.")
        return value

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)

class JobListingSerializer(serializers.ModelSerializer):
    employer_name = serializers.CharField(source='employer.get_full_name', read_only=True)
    employee_name = serializers.SerializerMethodField()
    employee_phone = serializers.SerializerMethodField()
    
    class Meta:
        model = JobListing
        fields = ('id', 'title', 'description', 'budget', 'status', 'employer', 'employer_name', 
                  'employee', 'employee_name', 'employee_phone', 'created_at', 'updated_at', 'assigned_at', 'completed_at', 'escrow_contract_id')
        read_only_fields = ('id', 'employer', 'status', 'created_at', 'updated_at', 
                          'assigned_at', 'completed_at', 'escrow_contract_id')
    
    def get_employee_name(self, obj):
        return obj.employee.get_full_name() if obj.employee else None
    
    def get_employee_phone(self, obj):
        return obj.employee.phone_number if obj.employee else None


class JobApplicationSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    employee_phone = serializers.CharField(source='employee.phone_number', read_only=True)
    employee_email = serializers.EmailField(source='employee.email', read_only=True)
    
    class Meta:
        model = JobApplication
        fields = ('id', 'job_listing', 'employee', 'employee_name', 'employee_phone', 'employee_email', 'status', 'created_at')
        read_only_fields = ('id', 'created_at')

class JobListingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobListing
        fields = ('title', 'description', 'budget')

class EscrowContractSerializer(serializers.ModelSerializer):
    job_listing_title = serializers.CharField(source='job_listing.title', read_only=True)
    
    class Meta:
        model = EscrowContract
        fields = ('id', 'contract_id', 'job_listing', 'job_listing_title', 'employer', 'employee', 
                  'amount', 'status', 'created_at', 'funded_at', 'released_at')
        read_only_fields = ('id', 'contract_id', 'created_at', 'funded_at', 'released_at')


