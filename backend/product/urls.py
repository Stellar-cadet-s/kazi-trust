from .email_auth import UserRegistrationView,EmailPasswordLoginView

from django.urls import path
from .ussd import ussd_handler

urlpatterns = [
   path('auth/register/', UserRegistrationView.as_view(), name='register'),
    path('ussd/', ussd_handler.handle_request, name='ussd_callback'),
    path('auth/login/', EmailPasswordLoginView.as_view(), name='email_login'),
]