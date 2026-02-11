"""
Stellar escrow Python client – hold, deposit, withdraw (release).

Works with the Kazi Soroban escrow contract (Rust):
- create(escrow_id, employer, asset) → hold
- deposit(escrow_id, from, amount) → deposit
- set_beneficiary(escrow_id, employee) → assign
- release(escrow_id) → withdraw to employee
- balance(escrow_id) → current held amount

When STELLAR_ESCROW_CONTRACT_ID and STELLAR_ESCROW_ADMIN_SECRET are not set,
operations no-op and return success (local/dev mode).
"""

import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


def _get_config():
    """Load config from Django settings or env when available."""
    out = {}
    try:
        from django.conf import settings
        out["network_passphrase"] = getattr(
            settings, "STELLAR_NETWORK_PASSPHRASE", "Test SDF Network ; September 2015"
        )
        out["soroban_rpc_url"] = getattr(
            settings, "STELLAR_SOROBAN_RPC_URL", "https://soroban-testnet.stellar.org"
        )
        out["contract_id"] = getattr(settings, "STELLAR_ESCROW_CONTRACT_ID", None)
        out["admin_secret"] = getattr(settings, "STELLAR_ESCROW_ADMIN_SECRET", None)
    except Exception:
        out.setdefault("network_passphrase", "Test SDF Network ; September 2015")
        out.setdefault("soroban_rpc_url", "https://soroban-testnet.stellar.org")
        out.setdefault("contract_id", None)
        out.setdefault("admin_secret", None)
    return out


class EscrowClient:
    """
    Client for Kazi escrow: hold (create), deposit, release (withdraw).
    If contract_id and admin_secret are set, uses stellar_sdk to invoke the Soroban contract.
    Otherwise runs in local mode (returns success, no on-chain calls).
    """

    def __init__(
        self,
        network_passphrase: str = None,
        soroban_rpc_url: str = None,
        contract_id: str = None,
        admin_secret: str = None,
    ):
        cfg = _get_config()
        self.network_passphrase = network_passphrase or cfg.get("network_passphrase")
        self.soroban_rpc_url = soroban_rpc_url or cfg.get("soroban_rpc_url")
        self.contract_id = contract_id or cfg.get("contract_id")
        self.admin_secret = admin_secret or cfg.get("admin_secret")

    def _local_mode(self):
        return not (self.contract_id and self.admin_secret)

    def create_escrow(
        self,
        escrow_id: str,
        employer_account: str,
        amount: float,
        asset_code: str = "XLM",
        job_id: str = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Create escrow (hold). Returns {"contract_id": escrow_id, ...}.
        In local mode always succeeds. With contract configured, invokes Soroban create().
        """
        result = {"contract_id": escrow_id, "amount": str(amount), "asset_code": asset_code}
        if self._local_mode():
            logger.info("create_escrow (local): %s", escrow_id)
            return result
        return self._invoke_create(escrow_id, employer_account, amount, asset_code) or result

    def _invoke_create(
        self, escrow_id: str, employer_account: str, amount: float, asset_code: str
    ) -> Optional[Dict[str, Any]]:
        try:
            from stellar_sdk import SorobanServer, Keypair, TransactionBuilder, Contract
            server = SorobanServer(self.soroban_rpc_url)
            kp = Keypair.from_secret(self.admin_secret)
            contract = Contract(self.contract_id)
            sym = escrow_id.replace("-", "_")[:32]
            # Native asset: use Stellar's built-in native contract id for the network
            asset_addr = self._native_asset_address(server)
            tx = (
                TransactionBuilder(kp.public_key, server)
                .set_network_passphrase(self.network_passphrase)
            )
            call = contract.call("create", sym, employer_account, asset_addr)
            tx = tx.append_invoke_contract_op(call).build()
            tx = server.prepare_transaction(tx)
            tx.sign(kp)
            r = server.send_transaction(tx)
            if r.get("status") in ("PENDING", "SUCCESS"):
                return {"contract_id": escrow_id, "amount": str(amount), "asset_code": asset_code}
        except Exception as e:
            logger.exception("create_escrow invoke: %s", e)
        return None

    def _native_asset_address(self, server) -> str:
        try:
            from stellar_sdk import Contract
            # Stellar testnet native asset contract id (replace with actual for your network)
            return "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQV3JP3KQCD3"
        except Exception:
            return "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQV3JP3KQCD3"

    def fund_escrow(
        self,
        contract_id: str,
        amount: float,
        transaction_hash: str = None,
    ) -> bool:
        """
        Deposit into escrow. In local mode returns True. Otherwise invokes contract deposit().
        """
        if self._local_mode():
            logger.info("fund_escrow (local): %s amount=%s", contract_id, amount)
            return True
        return self._invoke_deposit(contract_id, amount)

    def _invoke_deposit(self, contract_id: str, amount: float) -> bool:
        try:
            from stellar_sdk import SorobanServer, Keypair, TransactionBuilder, Contract
            server = SorobanServer(self.soroban_rpc_url)
            kp = Keypair.from_secret(self.admin_secret)
            contract = Contract(self.contract_id)
            sym = contract_id.replace("-", "_")[:32]
            amount_i128 = int(round(amount * 10_000_000))
            from_addr = kp.public_key
            tx = (
                TransactionBuilder(kp.public_key, server)
                .set_network_passphrase(self.network_passphrase)
            )
            call = contract.call("deposit", sym, from_addr, amount_i128)
            tx = tx.append_invoke_contract_op(call).build()
            tx = server.prepare_transaction(tx)
            tx.sign(kp)
            r = server.send_transaction(tx)
            return r.get("status") in ("PENDING", "SUCCESS")
        except Exception as e:
            logger.exception("fund_escrow invoke: %s", e)
            return False

    def set_beneficiary(self, contract_id: str, employee_account: str) -> bool:
        """Set beneficiary (employee). In local mode returns True."""
        if self._local_mode():
            return True
        try:
            from stellar_sdk import SorobanServer, Keypair, TransactionBuilder, Contract
            server = SorobanServer(self.soroban_rpc_url)
            kp = Keypair.from_secret(self.admin_secret)
            contract = Contract(self.contract_id)
            sym = contract_id.replace("-", "_")[:32]
            tx = (
                TransactionBuilder(kp.public_key, server)
                .set_network_passphrase(self.network_passphrase)
            )
            call = contract.call("set_beneficiary", sym, employee_account)
            tx = tx.append_invoke_contract_op(call).build()
            tx = server.prepare_transaction(tx)
            tx.sign(kp)
            r = server.send_transaction(tx)
            return r.get("status") in ("PENDING", "SUCCESS")
        except Exception as e:
            logger.exception("set_beneficiary: %s", e)
            return False

    def release_escrow(
        self,
        contract_id: str,
        employee_account: str,
        amount: float = None,
    ) -> bool:
        """
        Withdraw: release escrow to employee. Sets beneficiary then calls release().
        In local mode returns True.
        """
        if self._local_mode():
            logger.info("release_escrow (local): %s -> %s", contract_id, employee_account)
            return True
        self.set_beneficiary(contract_id, employee_account)
        try:
            from stellar_sdk import SorobanServer, Keypair, TransactionBuilder, Contract
            server = SorobanServer(self.soroban_rpc_url)
            kp = Keypair.from_secret(self.admin_secret)
            contract = Contract(self.contract_id)
            sym = contract_id.replace("-", "_")[:32]
            tx = (
                TransactionBuilder(kp.public_key, server)
                .set_network_passphrase(self.network_passphrase)
            )
            call = contract.call("release", sym)
            tx = tx.append_invoke_contract_op(call).build()
            tx = server.prepare_transaction(tx)
            tx.sign(kp)
            r = server.send_transaction(tx)
            return r.get("status") in ("PENDING", "SUCCESS")
        except Exception as e:
            logger.exception("release_escrow: %s", e)
            return False

    def get_balance(self, contract_id: str) -> Optional[int]:
        """Current held amount. Returns None in local mode or on error."""
        if self._local_mode():
            return None
        try:
            from stellar_sdk import SorobanServer, Contract
            server = SorobanServer(self.soroban_rpc_url)
            contract = Contract(self.contract_id)
            sym = contract_id.replace("-", "_")[:32]
            result = server.simulate_transaction(
                contract.call("balance", sym)
            )
            return result
        except Exception as e:
            logger.debug("get_balance: %s", e)
            return None

    def get_escrow_status(self, contract_id: str) -> Optional[Dict[str, Any]]:
        """Status dict with contract_id and balance."""
        bal = self.get_balance(contract_id)
        return {"contract_id": contract_id, "balance": bal}


# Module-level helpers that use default client
_default_client: Optional[EscrowClient] = None


def _client() -> EscrowClient:
    global _default_client
    if _default_client is None:
        _default_client = EscrowClient()
    return _default_client


def create_escrow(
    escrow_id: str,
    employer_account: str,
    amount: float,
    asset_code: str = "XLM",
    job_id: str = None,
) -> Optional[Dict[str, Any]]:
    return _client().create_escrow(escrow_id, employer_account, amount, asset_code, job_id)


def fund_escrow(contract_id: str, amount: float, transaction_hash: str = None) -> bool:
    return _client().fund_escrow(contract_id, amount, transaction_hash)


def release_escrow(
    contract_id: str,
    employee_account: str,
    amount: float = None,
) -> bool:
    return _client().release_escrow(contract_id, employee_account, amount)


def get_balance(contract_id: str) -> Optional[int]:
    return _client().get_balance(contract_id)


def get_escrow_status(contract_id: str) -> Optional[Dict[str, Any]]:
    return _client().get_escrow_status(contract_id)
