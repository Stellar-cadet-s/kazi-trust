from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .serializers import EmailPasswordLoginSerializer
from rest_framework_simplejwt.tokens import RefreshToken

class EmailPasswordLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = EmailPasswordLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            return Response({
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "email": user.email,
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .serializers import UserRegistrationSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from .models import CustomUser  # Make sure to import your user model

from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import UserRegistrationSerializer
from .models import CustomUser

class UserRegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        print("\n" + "🟢" * 30)
        print("🟢 NEW SIGNUP REQUEST RECEIVED 🟢")
        print("🟢" * 30)

        serializer = UserRegistrationSerializer(data=request.data)

        if serializer.is_valid():
            # Extract referral code (for debug display)
            ref_code = request.data.get('ref', None)

            # Pretty print what was received
            if ref_code:
                print(f"✨ Referral Code Received: '{ref_code}' ✨")
            else:
                print("🚫 No referral code received in request.")

            user = serializer.save()

            # Handle referral linking
            if ref_code:
                try:
                    inviter = CustomUser.objects.get(invite_code=ref_code)
                    user.invited_by = inviter
                    user.save()

                    inviter.points += 10
                    inviter.save()

                    print(f"🎉 Referral SUCCESS → Invited by: {inviter.email} (+10 points!)")
                except CustomUser.DoesNotExist:
                    print(f"⚠️ Invalid referral code: '{ref_code}' (no matching user found).")

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)

            print(f"✅ User '{user.email}' registered successfully.")
            print("🟢" * 30 + "\n")

            return Response({
                "message": "User registered successfully",
                "access": access_token,
                "refresh": refresh_token
            }, status=status.HTTP_201_CREATED)
        
        else:
            print("❌ Registration validation failed:", serializer.errors)
            print("🔴" * 30 + "\n")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




from .serializers import PasswordResetRequestSerializer, PasswordResetConfirmSerializer

class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(request)
            return Response({"message": "Password reset email sent."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Password has been reset."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)