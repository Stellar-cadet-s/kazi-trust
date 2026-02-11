from .email_auth import UserRegistrationView,PasswordResetRequestView,PasswordResetConfirmView,EmailPasswordLoginView

from django.urls import path


urlpatterns = [
   path('auth/register/', UserRegistrationView.as_view(), name='register'),

    path('auth/login/', EmailPasswordLoginView.as_view(), name='email_login'),
]