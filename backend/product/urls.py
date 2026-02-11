from django.urls import path
from .views import (
    UserRegistrationView, UserLoginView,
    ussd_registration_callback,
    JobListingListCreateView, JobListingDetailView,
    mpesa_deposit_callback, complete_work
)
from .ussd import ussd_handler

urlpatterns = [
    # Authentication endpoints
    path('auth/register/', UserRegistrationView.as_view(), name='register'),
    path('auth/login/', UserLoginView.as_view(), name='login'),
    
    # USSD endpoints
    path('ussd/', ussd_handler.handle_request, name='ussd_callback'),
    path('ussd/register-callback/', ussd_registration_callback, name='ussd_register_callback'),
    
    # Job listing endpoints
    path('jobs/', JobListingListCreateView.as_view(), name='job_listing_list_create'),
    path('jobs/<int:pk>/', JobListingDetailView.as_view(), name='job_listing_detail'),
    path('jobs/<int:job_id>/complete/', complete_work, name='complete_work'),
    
    # Payment callbacks
    path('callbacks/mpesa/deposit/', mpesa_deposit_callback, name='mpesa_deposit_callback'),
]