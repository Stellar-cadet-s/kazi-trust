# TrustWork – Full Stack Overview

> End-to-end guide for running the **smart contract**, **backend**, and **frontend** in this project – plus how the whole trust + payments flow works.

---

## 1. High-level architecture

This project is a full stack domestic work platform that connects **employers** and **workers** with:

- **Smart contract (Stellar Soroban)**: Holds funds in escrow.
- **Backend (Django REST)**: Business logic, security, and integrations (M‑Pesa, Paystack, Intersend, Soroban client, USSD).
- **Frontend (Next.js)**: Web app for employers and workers.

### Roles

- **Employer**
  - Posts jobs (domestic work, tasks).
  - Deposits money into escrow via **Paystack** (card, bank, etc.).
  - Assigns a worker from applicants.
  - Marks work as complete – escrow releases funds to the worker’s **M‑Pesa**.

- **Worker**
  - Creates account (web or USSD).
  - Browses and applies to jobs.
  - Builds **verifiable work history** (completed jobs with ratings/summary).
  - Gets paid to **M‑Pesa** and can optionally **save/invest** some earnings in Stellar USD.

---

## 2. Smart contract layer (Stellar Soroban)

### Contract ID

**Active escrow contract ID (Stellar Soroban):**

```text
CAL654B6VGGPX65U7QRFMXNQRK34SYZUSJA6FX3YILKLG7MTPZFBWRA2
```

This contract manages:

- **create_escrow** – create a new escrow for a job.
- **fund_escrow** – employer funds escrow (triggered after successful Paystack deposit).
- **release_escrow** – release funds from employer → worker when job is completed.
- **balance / state** – view current escrow state and balances.

> The Django backend calls this contract via a **Soroban client** (Python) so that the web app never exposes secret keys.

### Contract code & client

```text
stellar_escrow/
├── contract/             # Rust Soroban smart contract (on-chain logic)
│   ├── Cargo.toml
│   └── src/lib.rs        # create, fund, release, balance
└── python_client/
    ├── escrow_client.py  # Python wrapper: create_escrow, fund_escrow, release_escrow, get_balance
    └── ...
```

**How it ties into Django:**

- When an employer posts a job, the backend **creates an escrow** on Stellar (or prepares a record for it).
- When Paystack deposit succeeds, backend:
  - Updates the local `EscrowContract` record.
  - Calls the Soroban contract **fund_escrow**.
- When employer marks work complete, backend:
  - Calls **release_escrow**.
  - Triggers **Intersend** mobile-money payout to worker’s M‑Pesa number.

Environment variables control whether the backend uses the Python client, Rust service, or a mock for local dev.

---

## 3. Backend (Django REST API)

Location:

```text
backend/
├── backend/              # Django project (settings, URLs)
└── product/              # Main Django app
    ├── models.py
    ├── views.py
    ├── serializers.py
    ├── urls.py
    ├── ussd.py
    ├── mobile_money_integration.py
    └── stellar_integration.py
```

### Key models (simplified)

- `CustomUser`
  - `phone_number`, `email`
  - `user_type` – `employer` / `employee` / `admin`
  - `ussd_pin` – PIN for USSD login

- `JobListing`
  - `employer`, `title`, `description`, `budget`
  - `status` – `open`, `assigned`, `in_progress`, `completed`, `cancelled`
  - `employee` – worker assigned
  - `assigned_at`, `completed_at`
  - `work_summary` – text summary of tasks done (for verifiable work history)
  - `escrow_contract_id` – link to on-chain contract

- `JobApplication`
  - `job_listing`, `employee`, `status` (`pending`, `accepted`, `rejected`)

- `EscrowContract`
  - `job_listing`, `contract_id`, `amount`, `status`, timestamps.

- `MpesaDeposit`, `PaystackDeposit`
  - Track deposits via M‑Pesa and Paystack.

- `MobileMoneyPayout`
  - Payout to worker: `employee`, `phone_number`, `amount`, `status`.

- `JobMessage`
  - For chat: `job_listing`, `sender`, `text`, `created_at`.

### Key API endpoints

Authentication:

- `POST /api/auth/register/` – register with phone + password + type (employer/employee).
- `POST /api/auth/login/` – login with email or phone + password.

Jobs (employer & worker):

- `GET /api/jobs/` – list jobs.
  - Employer: sees own jobs.
  - Employee: sees open jobs + jobs assigned to them.
- `POST /api/jobs/` – employer creates a job.
- `GET /api/jobs/{id}/` – job detail.
- `PATCH /api/jobs/{id}/` – employer updates job:
  - `applicant_id` – assign a worker from applicants.
  - (Legacy) `employee_id` – assign by user.
- `POST /api/jobs/{id}/apply/` – worker applies to a job (`JobApplication`).
- `POST /api/jobs/{id}/withdraw-application/` – worker withdraws pending application.
- `GET /api/jobs/{id}/applicants/` – employer sees applicants for a job (with worker phone + verified work history).

Escrow & payments:

- `POST /api/jobs/{id}/initiate-paystack/` – backend returns Paystack reference + amount (kobo).
- `POST /api/callbacks/paystack/deposit/` – Paystack webhook; marks deposit completed + funds escrow.
- `POST /api/callbacks/mpesa/deposit/` – M‑Pesa deposit callback (if used).
- `GET /api/jobs/{id}/escrow/` – escrow status for a job.
- `POST /api/jobs/{id}/complete/`
  - Employer marks work complete.
  - Body can include `{ "work_summary": "Tasks done..." }`.
  - Calls Soroban contract to release funds.
  - Triggers mobile-money payout to worker.

Transactions:

- `GET /api/transactions/`
  - Employer: deposit history.
  - Employee: payout history.

USSD:

- `POST /api/ussd/`
  - Handles USSD sessions; supports JSON or form data:
    - `sessionId`, `phoneNumber`, `text`.
- `POST /api/ussd/register-callback/`
  - Registration callback from USSD flow.

Employer workers overview:

- `GET /api/employer/workers-overview/`
  - Returns:
    - `hired_workers` (jobs with assigned workers, duration, M‑Pesa number).
    - `open_jobs_with_applicants` (open jobs + applicants + their verified work history).

Employee work history:

- `GET /api/employee/my-applications/` – jobs the worker has applied for.
- `GET /api/employee/work-history/` – **verifiable work history** (completed jobs, summary, duration).

Job chat:

- `GET /api/chats/` – list jobs (with assigned worker) where the current user can chat.
- `GET /api/jobs/{id}/messages/` – list chat messages for that job.
- `POST /api/jobs/{id}/messages/` – send a message.

### Backend – running locally

```bash
cd backend
python3 -m venv venv
source venv/bin/activate

pip install -r requirements.txt

python3 manage.py migrate
python3 manage.py runserver 0.0.0.0:8000
```

Environment variables (examples):

- `STELLAR_USE_PYTHON_CLIENT=true` – use the Python Soroban client.
- `STELLAR_NETWORK` – network (testnet/mainnet).
- `PAYSTACK_PUBLIC_KEY`, `PAYSTACK_SECRET_KEY`
- `INTERSEND_API_KEY`, `INTERSEND_API_URL`

---

## 4. Frontend (Next.js)

Location:

```text
frontend/
├── app/
│   ├── page.tsx                    # Landing page (trust + Stellar savings)
│   ├── auth/                       # Login / Register / Logout
│   ├── employer/                   # Employer dashboard, jobs, workers, transactions, rights
│   └── worker/                     # Worker dashboard, browse, work history, financial literacy, transactions, rights
├── components/
│   ├── ui/                         # Buttons, cards, inputs, badges, etc.
│   ├── layout/                     # Navbar, Sidebar, PageHeader
│   └── ChatWidget.tsx              # Floating chat widget (employer↔worker per job)
├── services/api.ts                 # Typed API client (auth, jobs, escrow, chat, etc.)
├── types/                          # Shared TypeScript types
└── ...
```

### Key screens

Public:

- `/` – Landing page
  - Explains what the platform does.
  - Shows the **trust mechanism** between employer and worker.
  - Shows **Stellar savings / APY** explanation (how workers can earn interest on savings).

Auth:

- `/auth/login` – login with email or phone.
- `/auth/register` – register as employer or worker.

Employer:

- `/employer/dashboard`
  - Stats: total jobs, workers hired, active, completed.
  - Recent jobs with actions:
    - Fund escrow via Paystack.
    - Mark work as done → releases escrow → pays worker.
  - “Employees Hired & Duration” widget (hired workers, job durations, M‑Pesa numbers).
- `/employer/contracts/new` – post a new job.
- `/employer/workers`
  - **Find workers**:
    - Shows open jobs with applicants.
    - For each applicant: name, M‑Pesa number, **verified work history** cards (previous completed jobs, duration, tasks).
    - Employer can **assign** directly from this page.
- `/employer/transactions` – deposit / payout history (from employer’s perspective).
- `/employer/rights` – rights & information.

Worker:

- `/worker/dashboard`
  - **Total earnings** (sum of completed payouts).
  - **M‑Pesa number** used for payouts.
  - Active / open jobs counts.
  - **Escrow card**: per job – KES held in escrow + when it will be released.
  - **“Save & earn (Stellar USD)”** section:
    - Shows invested amount (placeholder) and estimated return (e.g. ~5% APY).
    - Explains that the worker can choose how much to keep in M‑Pesa vs invest in Stellar USD to earn interest.
- `/worker/browse`
  - List of open jobs.
  - Worker can **apply** (uses the `/apply/` endpoint).
  - Shows “Applied” / “Withdraw” buttons when appropriate.
- `/worker/work-history`
  - Worker-facing **verifiable work history**:
    - Completed jobs with verified badge, employer name, duration, KES amount, and work summary.
- `/worker/financial-literacy`
  - **Chatbot-style** financial literacy guide.
  - Languages: **English** and **Kiswahili**.
  - Topics: saving, budgeting, using M‑Pesa, interest, avoiding bad debt, goal setting.
  - Beautiful, minimal chat UI with topic chips and quick replies.
- `/worker/transactions`
  - Worker’s payouts and amounts.
- `/worker/rights`
  - Rights & legal information.

### Chat widget (UI)

Component: `components/ChatWidget.tsx`

- **Floating blue button** in bottom-right (on both worker and employer layouts).
- Opens a **minimal chat panel**:
  - Left view: list of active chats (jobs).
  - Right view: messages for selected job.
  - Messages:
    - Your messages: blue bubbles on the right.
    - Other side: gray/white bubbles on the left with sender name.
  - Input: single-line field + send button, with placeholder like “Message (e.g. job address)...”.

Uses:

- `GET /api/chats/` to list available conversations.
- `GET /api/jobs/{id}/messages/` to load messages.
- `POST /api/jobs/{id}/messages/` to send.

### Frontend – running locally

```bash
cd frontend
npm install

cp .env.example .env.local
# Edit .env.local:
# NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 5. End-to-end flow (how everything works)

### 5.1 Employer posts a job

1. Employer logs in → `/employer/dashboard`.
2. Clicks **“Post a Job”** → fills in title, description, budget.
3. Backend creates:
   - `JobListing`.
   - An associated `EscrowContract` record.
   - Optionally calls Soroban contract **create_escrow** using the contract ID:

```text
CAL654B6VGGPX65U7QRFMXNQRK34SYZUSJA6FX3YILKLG7MTPZFBWRA2
```

### 5.2 Worker applies and is assigned

1. Worker goes to `/worker/browse` and sees all open jobs.
2. Clicks **Apply** on a job → backend creates `JobApplication`.
3. Employer sees applicants:
   - On `/employer/workers` and job detail page.
   - For each applicant:
     - Name, phone (M‑Pesa number).
     - **Verified work history** (past completed jobs).
4. Employer selects an applicant and clicks **Assign**.
   - Backend:
     - Ensures applicant belongs to that job.
     - Sets `job_listing.employee`.
     - Sets status to `assigned`, `assigned_at` timestamp.
     - Links escrow to worker.

### 5.3 Employer funds escrow (Paystack) and trust

1. On `/employer/dashboard` or job detail page:
   - Employer clicks **Deposit with Paystack**.
2. Frontend:
   - Calls `POST /api/jobs/{id}/initiate-paystack/`.
   - Receives `reference`, `amount_kobo`, `email`, etc.
   - Opens Paystack widget with that reference.
3. Paystack:
   - On success, calls the backend webhook `/api/callbacks/paystack/deposit/`.
4. Backend:
   - Verifies signature.
   - Marks `PaystackDeposit` as `completed`.
   - Updates `EscrowContract` to `funded`.
   - Optionally calls Soroban **fund_escrow** on the contract ID above.
5. Worker dashboard:
   - Shows **Amount held in escrow** for assigned jobs, in KES.

At this point:

- Employer knows money is in escrow and safe.
- Worker knows payment is locked and will be released when work is complete.

### 5.4 Work complete → escrow release → payout

1. Employer marks a job as complete:
   - On dashboard or job page, clicks **“Mark complete & release payment”**.
   - Optionally fills **“Tasks completed”** (work_summary) for verified work.
2. Backend:
   - Validates employer is owner of the job.
   - Ensures job status is `assigned` or `in_progress`.
   - Sets job to `completed`, saves `work_summary`.
   - Checks `EscrowContract` is `funded`.
   - Calls **release_escrow** on Soroban contract:
     - `contract_id = CAL654B6VGGPX65U7QRFMXNQRK34SYZUSJA6FX3YILKLG7MTPZFBWRA2`.
   - Updates escrow status to `released`.
   - Creates `MobileMoneyPayout` with:
     - Worker’s `phone_number` (normalized to 254… format).
     - Amount.
   - Calls Intersend API to send mobile money to worker.
3. Worker:
   - Sees payout in `/worker/transactions` and **Total earnings** on dashboard.

### 5.5 Chat for location & coordination

At any time after a worker is assigned:

- Employer and worker can use the **floating chat widget**:
  - Share job location, directions, time, and clarifications.
  - Messages are stored per job in `JobMessage`.

---

## 6. USSD testing with curl (optional)

USSD endpoint:

```text
POST /api/ussd/
```

JSON example:

```bash
curl -X POST http://localhost:8000/api/ussd/ \
  -H \"Content-Type: application/json\" \
  -d '{
    \"sessionId\": \"session-123\",
    \"phoneNumber\": \"254700000000\",
    \"text\": \"\"
  }'
```

Form example:

```bash
curl -X POST http://localhost:8000/api/ussd/ \
  -d \"sessionId=session-123\" \
  -d \"phoneNumber=254700000000\" \
  -d \"text=1\"
```

---

## 7. Running everything together

1. **Start backend (Django + API)**
   ```bash
   cd backend
   source venv/bin/activate   # if created
   python3 manage.py migrate
   python3 manage.py runserver 0.0.0.0:8000
   ```

2. **Start frontend (Next.js)**
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local
   # ensure NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   npm run dev
   ```

3. **Confirm contract integration** (optional for dev)
   - Set STELLAR environment variables so `stellar_integration.py` can call Soroban.
   - Make sure the contract ID is set or used in your settings:
     - `CAL654B6VGGPX65U7QRFMXNQRK34SYZUSJA6FX3YILKLG7MTPZFBWRA2`

4. **Open the app**
   - Web: `http://localhost:3000`
   - Backend API: `http://localhost:8000/api/`

You now have:

- Soroban **smart contract escrow** on Stellar.
- Django **backend** handling business logic, mobile money, and contract calls.
- Next.js **frontend** for employers and workers, including:
  - Verified work history.
  - Escrow-based trust.
  - Paystack deposits.
  - M‑Pesa payouts.
  - Job chat.
  - Financial literacy in local language.
