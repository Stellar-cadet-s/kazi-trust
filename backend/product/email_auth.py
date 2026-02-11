# Legacy email auth views - kept for backward compatibility
# New views are in views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .serializers import EmailPasswordLoginSerializer
from rest_framework_simplejwt.tokens import RefreshToken

class EmailPasswordLoginView(APIView):
    """Legacy login view - use UserLoginView from views.py instead"""
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
