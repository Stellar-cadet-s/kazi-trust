"""
Mobile Money Integration Module
Handles mobile money payouts via Intersend API
"""
import requests
import logging
from typing import Optional, Dict
from django.conf import settings

logger = logging.getLogger(__name__)

# Intersend API configuration
# These should be set in your Django settings
INTERSEND_API_URL = getattr(
    settings,
    'INTERSEND_API_URL',
    'https://api.intersend.com/v1'  # Update with actual Intersend API URL
)
INTERSEND_API_KEY = getattr(settings, 'INTERSEND_API_KEY', None)
INTERSEND_API_SECRET = getattr(settings, 'INTERSEND_API_SECRET', None)


class IntersendClient:
    """Client for Intersend mobile money API"""
    
    def __init__(self, api_url: str = None, api_key: str = None, api_secret: str = None):
        self.api_url = api_url or INTERSEND_API_URL
        self.api_key = api_key or INTERSEND_API_KEY
        self.api_secret = api_secret or INTERSEND_API_SECRET
        self.headers = {
            'Content-Type': 'application/json',
        }
        if self.api_key:
            self.headers['Authorization'] = f'Bearer {self.api_key}'
        if self.api_secret:
            self.headers['X-API-Secret'] = self.api_secret
    
    def send_mobile_money(
        self,
        phone_number: str,
        amount: float,
        currency: str = 'KES',
        reference: str = None,
        callback_url: str = None
    ) -> Optional[Dict]:
        """
        Send mobile money to a phone number
        
        Args:
            phone_number: Phone number in format 254XXXXXXXXX or 0XXXXXXXXX
            amount: Amount to send
            currency: Currency code (default: KES)
            reference: Transaction reference
            callback_url: Optional callback URL for status updates
            
        Returns:
            Dict with transaction_id and status, or None if failed
        """
        try:
            # Format phone number (ensure it starts with country code)
            if phone_number.startswith('0'):
                phone_number = '254' + phone_number[1:]
            elif not phone_number.startswith('254'):
                phone_number = '254' + phone_number
            
            payload = {
                'phone_number': phone_number,
                'amount': str(amount),
                'currency': currency,
                'reference': reference or f'PAYOUT_{phone_number}',
            }
            
            if callback_url:
                payload['callback_url'] = callback_url
            
            response = requests.post(
                f'{self.api_url}/payouts/send',
                json=payload,
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                logger.info(f"Mobile money payout initiated: {data.get('transaction_id')}")
                return data
            else:
                logger.error(f"Failed to send mobile money: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error sending mobile money: {str(e)}")
            return None
    
    def check_payout_status(self, transaction_id: str) -> Optional[Dict]:
        """
        Check status of a mobile money payout
        
        Args:
            transaction_id: Transaction ID from send_mobile_money
            
        Returns:
            Dict with transaction status, or None if failed
        """
        try:
            response = requests.get(
                f'{self.api_url}/payouts/{transaction_id}',
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Failed to check payout status: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"Error checking payout status: {str(e)}")
            return None


# Singleton instance
_intersend_client = None

def get_intersend_client() -> IntersendClient:
    """Get singleton Intersend client instance"""
    global _intersend_client
    if _intersend_client is None:
        _intersend_client = IntersendClient()
    return _intersend_client
