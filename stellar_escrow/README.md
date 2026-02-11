# Stellar Escrow – Full Directory

This directory contains everything for **holding**, **deposit**, and **withdrawal** of escrow funds on Stellar, used by the Kazi Trust backend.

## Directory layout

```
stellar_escrow/
├── README.md                 # This file
├── contract/                 # Soroban (Rust) smart contract
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs             # Escrow logic: create, deposit, set_beneficiary, release, balance
└── python_client/            # Python client used by Django
    ├── README.md
    ├── __init__.py
    └── escrow_client.py       # EscrowClient: create_escrow, fund_escrow, release_escrow, get_balance
```

## What the Rust contract does (Soroban)

The **contract** is a Stellar Soroban smart contract written in Rust. It:

- **Holding:** Reserves a slot per job so funds can be held in escrow.
- **Deposit:** Accepts token transfers into that slot (employer or custody account).
- **Withdrawal:** Sends the full balance of a slot to the beneficiary (employee) when the employer calls `release`.

### Contract functions

| Function | Who calls | Effect |
|----------|-----------|--------|
| `create(escrow_id, employer, asset)` | Backend / admin | Creates an escrow slot for a job. |
| `deposit(escrow_id, from, amount)` | Backend (after M-Pesa) | Deposits tokens into the escrow (hold). |
| `set_beneficiary(escrow_id, employee)` | Backend (when job assigned) | Sets who can receive the release. |
| `release(escrow_id)` | Backend (work complete) | Withdraws full balance to beneficiary. |
| `balance(escrow_id)` | Anyone | Returns current held amount. |

### Build and deploy (contract)

```bash
cd stellar_escrow/contract
cargo build --target wasm32-unknown-unknown --release
# Use Soroban CLI to deploy:
# soroban contract deploy --wasm target/wasm32-unknown-unknown/release/kazi_escrow.wasm --source ADMIN --network testnet
```

Set the deployed contract id in Django:

- `STELLAR_ESCROW_CONTRACT_ID = "<deployed_contract_id>"`

## What the Python client does

The **python_client** talks to the same escrow contract from Django:

- **Holding:** Calls `create_escrow(escrow_id, employer_account, amount, ...)` → invokes contract `create(...)`.
- **Deposit:** Calls `fund_escrow(contract_id, amount, ...)` → invokes contract `deposit(...)` (after M-Pesa, backend credits escrow).
- **Withdrawal:** Calls `release_escrow(contract_id, employee_account)` → invokes `set_beneficiary` then `release(...)`.

If `STELLAR_ESCROW_CONTRACT_ID` and `STELLAR_ESCROW_ADMIN_SECRET` are not set, the client runs in **local mode**: no on-chain calls, all operations return success (for local/dev).

## Wiring to Django

1. Add the repo root to `PYTHONPATH` so `stellar_escrow.python_client` is importable, or install the package.
2. In `backend/settings.py`:

   ```python
   STELLAR_USE_PYTHON_CLIENT = True
   STELLAR_ESCROW_CONTRACT_ID = "..."   # From deploy step
   STELLAR_ESCROW_ADMIN_SECRET = "S..." # Key that can create/deposit/release
   STELLAR_SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org"
   STELLAR_NETWORK_PASSPHRASE = "Test SDF Network ; September 2015"
   ```

3. `backend/product/stellar_integration.py` already uses the Python client when `STELLAR_USE_PYTHON_CLIENT` is True and `stellar_escrow.python_client` is available; otherwise it uses the HTTP microservice (if configured).

## Flow summary

1. **Create job** (Django) → generate `contract_id` (e.g. `ESCROW_J1`) → **create** escrow on Stellar (hold slot).
2. **M-Pesa deposit** → Django callback → **deposit** into escrow (fund the hold).
3. **Assign employee** → Django stores beneficiary; before release you can call **set_beneficiary**.
4. **Work complete** (Django) → **release** escrow → tokens sent to employee (withdrawal).

The Rust contract enforces: only employer can deposit and release; release only to the set beneficiary; amounts are in the contract’s token (e.g. native asset).
