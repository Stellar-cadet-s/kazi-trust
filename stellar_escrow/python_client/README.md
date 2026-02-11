# Kazi Trust – Stellar Escrow Python Client

Python client for **holding**, **deposit**, and **withdrawal** (release) using the Kazi escrow Soroban contract or Stellar claimable balances.

## Install

From repo root:

```bash
pip install stellar-sdk
# or add to requirements: stellar-sdk>=11.0.0
```

For Soroban (contract invokes), use a Stellar SDK version with Soroban support (e.g. `stellar-sdk` with Soroban RPC).

## Usage from Django

Set in `settings.py`:

```python
STELLAR_ESCROW_MODE = "soroban"  # or "claimable" for classic
STELLAR_NETWORK_PASSPHRASE = "Test SDF Network ; September 2015"  # or Public
STELLAR_HORIZON_URL = "https://horizon-testnet.stellar.org"
STELLAR_SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org"  # if soroban
STELLAR_ESCROW_CONTRACT_ID = "..."  # deployed contract id (soroban)
STELLAR_ESCROW_ADMIN_SECRET = "S..."  # admin key for creating escrows
```

Then use `stellar_escrow.python_client.client` in `stellar_integration.py` (see backend wiring).

## API (matches Django stellar_integration)

- **create_escrow(escrow_id, employer_account, amount, asset_code="XLM", job_id=None)**  
  Creates escrow (hold slot). Returns `{"contract_id": escrow_id, ...}`.

- **fund_escrow(contract_id, amount, transaction_hash=None)**  
  Deposit into escrow (after M-Pesa). Returns `True` on success.

- **release_escrow(contract_id, employee_account, amount=None)**  
  Withdrawal: release full balance to employee.

- **get_balance(contract_id)**  
  Returns current held amount.
