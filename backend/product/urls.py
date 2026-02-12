from django.urls import path
from .views import (
    UserRegistrationView, UserLoginView,
    ussd_registration_callback,
    JobListingListCreateView, JobListingDetailView,
    mpesa_deposit_callback, paystack_deposit_callback,
    complete_work, apply_to_job, withdraw_application, job_applicants,
    initiate_paystack, job_escrow, transactions,
    employer_workers_overview,
    my_applications,
    employee_work_history,
    job_messages,
    my_chats,
)
from .ussd import ussd_handler

urlpatterns = [
    # Authentication
    path('auth/register/', UserRegistrationView.as_view(), name='register'),
    path('auth/login/', UserLoginView.as_view(), name='login'),
    
    # USSD
    path('ussd/', ussd_handler.handle_request, name='ussd_callback'),
    path('ussd/register-callback/', ussd_registration_callback, name='ussd_register_callback'),
    
    # Jobs
    path('jobs/', JobListingListCreateView.as_view(), name='job_listing_list_create'),
    path('jobs/<int:pk>/', JobListingDetailView.as_view(), name='job_listing_detail'),
    path('jobs/<int:job_id>/apply/', apply_to_job, name='apply_to_job'),
    path('jobs/<int:job_id>/withdraw-application/', withdraw_application, name='withdraw_application'),
    path('jobs/<int:job_id>/applicants/', job_applicants, name='job_applicants'),
    path('jobs/<int:job_id>/initiate-paystack/', initiate_paystack, name='initiate_paystack'),
    path('jobs/<int:job_id>/escrow/', job_escrow, name='job_escrow'),
    path('jobs/<int:job_id>/complete/', complete_work, name='complete_work'),
    
    # Transactions
    path('transactions/', transactions, name='transactions'),
    # Employee my applications
    path('employee/my-applications/', my_applications, name='my_applications'),
    path('employee/work-history/', employee_work_history, name='employee_work_history'),
    path('chats/', my_chats, name='my_chats'),
    path('jobs/<int:job_id>/messages/', job_messages, name='job_messages'),
    # Employer Find Workers
    path('employer/workers-overview/', employer_workers_overview, name='employer_workers_overview'),
    
    # Payment callbacks
    path('callbacks/mpesa/deposit/', mpesa_deposit_callback, name='mpesa_deposit_callback'),
    path('callbacks/paystack/deposit/', paystack_deposit_callback, name='paystack_deposit_callback'),
]