"""
Stellar Contract Integration Module
Handles interactions with Stellar Rust smart contracts for escrow operations.

Supports two backends:
1. Python client (stellar_escrow.python_client): hold, deposit, release via Soroban contract.
   Set STELLAR_USE_PYTHON_CLIENT = True and optionally STELLAR_ESCROW_CONTRACT_ID,
   STELLAR_ESCROW_ADMIN_SECRET, STELLAR_SOROBAN_RPC_URL.
2. HTTP microservice: set STELLAR_CONTRACT_SERVICE_URL (and STELLAR_CONTRACT_API_KEY).
"""
import requests
import logging
from typing import Optional, Dict
from django.conf import settings

logger = logging.getLogger(__name__)

# Use Python escrow client when True and stellar_escrow package is available
try:
    STELLAR_USE_PYTHON_CLIENT = getattr(settings, 'STELLAR_USE_PYTHON_CLIENT', False)
except Exception:
    STELLAR_USE_PYTHON_CLIENT = False
STELLAR_CONTRACT_SERVICE_URL = getattr(
    settings,
    'STELLAR_CONTRACT_SERVICE_URL',
    'http://localhost:8001',
)
STELLAR_CONTRACT_API_KEY = getattr(settings, 'STELLAR_CONTRACT_API_KEY', None)

# Lazy import Python escrow client (may live in stellar_escrow at repo root)
def _get_python_client():
    try:
        from stellar_escrow.python_client import EscrowClient
        return EscrowClient()
    except ImportError:
        try:
            import sys
            from pathlib import Path
            root = Path(__file__).resolve().parent.parent.parent.parent
            if root.exists():
                sys.path.insert(0, str(root))
            from stellar_escrow.python_client import EscrowClient
            return EscrowClient()
        except ImportError:
            return None


class StellarEscrowClient:
    """Client for interacting with Stellar escrow contracts (HTTP or Python/Soroban)."""

    def __init__(self, service_url: str = None, api_key: str = None, use_python: bool = None):
        self.use_python = use_python if use_python is not None else STELLAR_USE_PYTHON_CLIENT
        self._python_client = _get_python_client() if self.use_python else None
        self.service_url = service_url or STELLAR_CONTRACT_SERVICE_URL
        self.api_key = api_key or STELLAR_CONTRACT_API_KEY
        self.headers = {'Content-Type': 'application/json'}
        if self.api_key:
            self.headers['Authorization'] = f'Bearer {self.api_key}'

    def create_escrow_contract(
        self, 
        employer_account: str,
        amount: float,
        asset_code: str = 'XLM',
        job_id: str = None
    ) -> Optional[Dict]:
        """
        Create a new escrow contract on Stellar
        
        Args:
            employer_account: Stellar account ID of the employer
            amount: Amount to escrow
            asset_code: Asset code (default: XLM)
            job_id: Optional job ID for reference
            
        Returns:
            Dict with contract_id and other details, or None if failed
        """
        if self._python_client:
            import uuid
            escrow_id = f"ESCROW_J{job_id}" if job_id else f"ESCROW_{uuid.uuid4().hex[:16].upper()}"
            data = self._python_client.create_escrow(
                escrow_id=escrow_id,
                employer_account=employer_account,
                amount=float(amount),
                asset_code=asset_code,
                job_id=job_id,
            )
            if data:
                data["contract_id"] = data.get("contract_id") or escrow_id
            return data
        try:
            payload = {
                'employer_account': employer_account,
                'amount': str(amount),
                'asset_code': asset_code,
                'job_id': job_id
            }
            response = requests.post(
                f'{self.service_url}/api/escrow/create',
                json=payload,
                headers=self.headers,
                timeout=30
            )
            if response.status_code == 200:
                data = response.json()
                logger.info(f"Escrow contract created: {data.get('contract_id')}")
                return data
            logger.error(f"Failed to create escrow: {response.status_code} - {response.text}")
            return None
        except Exception as e:
            logger.error(f"Error creating escrow contract: {str(e)}")
            return None
    
    def fund_escrow_contract(
        self,
        contract_id: str,
        amount: float,
        transaction_hash: str = None
    ) -> bool:
        """
        Fund an escrow contract (called after M-Pesa deposit)
        
        Args:
            contract_id: Stellar contract ID
            amount: Amount being funded
            transaction_hash: Optional transaction hash from deposit
            
        Returns:
            True if successful, False otherwise
        """
        if self._python_client:
            return self._python_client.fund_escrow(contract_id, float(amount), transaction_hash)
        try:
            payload = {
                'contract_id': contract_id,
                'amount': str(amount),
                'transaction_hash': transaction_hash
            }
            response = requests.post(
                f'{self.service_url}/api/escrow/fund',
                json=payload,
                headers=self.headers,
                timeout=30
            )
            if response.status_code == 200:
                logger.info(f"Escrow contract funded: {contract_id}")
                return True
            logger.error(f"Failed to fund escrow: {response.status_code} - {response.text}")
            return False
        except Exception as e:
            logger.error(f"Error funding escrow contract: {str(e)}")
            return False
    
    def release_escrow_contract(
        self,
        contract_id: str,
        employee_account: str,
        amount: float = None
    ) -> bool:
        """
        Release escrow funds to employee
        
        Args:
            contract_id: Stellar contract ID
            employee_account: Stellar account ID of employee
            amount: Optional amount (if None, releases all)
            
        Returns:
            True if successful, False otherwise
        """
        if self._python_client:
            return self._python_client.release_escrow(
                contract_id, employee_account, float(amount) if amount is not None else None
            )
        try:
            payload = {'contract_id': contract_id, 'employee_account': employee_account}
            if amount:
                payload['amount'] = str(amount)
            response = requests.post(
                f'{self.service_url}/api/escrow/release',
                json=payload,
                headers=self.headers,
                timeout=30
            )
            if response.status_code == 200:
                logger.info(f"Escrow contract released: {contract_id} -> {employee_account}")
                return True
            logger.error(f"Failed to release escrow: {response.status_code} - {response.text}")
            return False
        except Exception as e:
            logger.error(f"Error releasing escrow contract: {str(e)}")
            return False
    
    def get_escrow_status(self, contract_id: str) -> Optional[Dict]:
        """
        Get current status of an escrow contract
        
        Args:
            contract_id: Stellar contract ID
            
        Returns:
            Dict with contract status and details, or None if failed
        """
        if self._python_client:
            return self._python_client.get_escrow_status(contract_id)
        try:
            response = requests.get(
                f'{self.service_url}/api/escrow/{contract_id}',
                headers=self.headers,
                timeout=30
            )
            if response.status_code == 200:
                return response.json()
            logger.error(f"Failed to get escrow status: {response.status_code}")
            return None
        except Exception as e:
            logger.error(f"Error getting escrow status: {str(e)}")
            return None
    
    def cancel_escrow_contract(self, contract_id: str) -> bool:
        """
        Cancel an escrow contract and refund employer
        
        Args:
            contract_id: Stellar contract ID
            
        Returns:
            True if successful, False otherwise
        """
        try:
            response = requests.post(
                f'{self.service_url}/api/escrow/{contract_id}/cancel',
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 200:
                logger.info(f"Escrow contract cancelled: {contract_id}")
                return True
            else:
                logger.error(f"Failed to cancel escrow: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Error cancelling escrow contract: {str(e)}")
            return False


# Singleton instance
_stellar_client = None

def get_stellar_client() -> StellarEscrowClient:
    """Get singleton Stellar client instance"""
    global _stellar_client
    if _stellar_client is None:
        _stellar_client = StellarEscrowClient()
    return _stellar_client
