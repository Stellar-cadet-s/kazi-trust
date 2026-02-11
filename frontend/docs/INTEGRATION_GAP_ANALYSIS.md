# Backend-Frontend Integration Gap Analysis

**Project:** TrustWork (Kazi Trust)  
**Date:** 2024-01-15  
**Status:** Backend Complete | Frontend UI Complete | Integration Pending

---

## Executive Summary

The backend is a **USSD-first platform** with Django REST API. The frontend was built assuming a **web-first REST API**. There are **significant architectural mismatches** that require professional integration work.

---

## Backend Architecture (Current State)

### Technology Stack
- **Framework:** Django 4.2.7
- **Database:** SQLite3
- **Auth:** JWT (rest_framework_simplejwt)
- **Primary Interface:** USSD (Africa's Talking style)
- **Secondary Interface:** REST API (minimal)

### Data Models

#### CustomUser
```python
- phone_number (primary identifier, unique)
- email (optional, unique)
- first_name, last_name
- user_type: 'client' | 'employee' | 'admin'
- ussd_pin (6-digit, for USSD login)
- password (for web login)
```

#### Task (equivalent to frontend "Contract")
```python
- client (ForeignKey to CustomUser)
- employee (ForeignKey to CustomUser, nullable)
- title
- description
- status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'verified'
- price (DecimalField)
- employee_rating (1-5 stars)
- client_feedback
```

#### Payment
```python
- task (ForeignKey)
- amount
- reference (M-Pesa transaction ID)
- status: 'pending' | 'completed' | 'failed'
```

### Existing API Endpoints

#### ✅ Implemented
1. **POST /api/auth/register/**
   - Fields: `phone_number`, `password`, `email`, `first_name`, `last_name`, `user_type`
   - Returns: JWT tokens + user object
   
2. **POST /api/auth/login/**
   - Fields: `email` OR `phone_number`, `password`
   - Returns: JWT tokens + user object

3. **POST /api/ussd/**
   - USSD callback handler (full CRUD via USSD)

#### ❌ Missing (Required by Frontend)
- GET /api/auth/me
- GET /api/workers (list workers)
- GET /api/workers/{id}
- GET /api/contracts (list tasks/jobs)
- POST /api/contracts (create task)
- GET /api/contracts/{id}
- PATCH /api/contracts/{id}/status
- POST /api/contracts/{id}/complete
- POST /api/escrow/lock
- POST /api/escrow/release

---

## Frontend Architecture (Current State)

### Technology Stack
- **Framework:** Next.js 16.1.6 (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS 4
- **Auth:** JWT (expected)

### Data Models (TypeScript)

#### User
```typescript
- id: string
- email: string
- name: string
- phone: string
- role: 'employer' | 'worker'
- verified: boolean
```

#### Contract (equivalent to backend "Task")
```typescript
- id: string
- title: string
- description: string
- amount: number
- status: 'pending' | 'active' | 'completed' | 'cancelled'
- employerId: string
- workerId?: string
- startDate: string
- location: string
```

### Expected API Endpoints (from frontend/services/api.ts)
All documented in `frontend/docs/03_API_CONTRACT.md`

---

## Critical Mismatches

### 1. **Terminology Mismatch**

| Frontend | Backend | Impact |
|----------|---------|--------|
| Contract | Task | High - All API calls use wrong naming |
| Employer | Client | High - user_type mismatch |
| Worker | Employee | High - user_type mismatch |
| amount | price | Medium - Field name mismatch |
| active | assigned/in_progress | Medium - Status mapping needed |

### 2. **User Type Mismatch**

**Frontend expects:**
```typescript
role: 'employer' | 'worker'
```

**Backend has:**
```python
user_type: 'client' | 'employee' | 'admin'
```

**Solution:** Backend needs to map or frontend needs to adapt.

### 3. **Authentication Flow Mismatch**

**Frontend expects:**
```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "pass"
}
Response: { "user": {...}, "token": "..." }
```

**Backend returns:**
```json
{
  "access": "jwt_token",
  "refresh": "refresh_token",
  "email": "user@example.com"
}
```

**Missing:** Full user object in response.

### 4. **Missing REST Endpoints**

Backend has **USSD-complete** functionality but **minimal REST API**.

**Required endpoints (not implemented):**
- Worker/Employee listing with filters
- Task/Contract CRUD via REST
- Task assignment
- Task completion workflow
- Escrow operations (if using Stellar)
- Payment status tracking

### 5. **Escrow/Payment Architecture**

**Frontend assumes:**
- Stellar blockchain escrow (server-side)
- Endpoints: `/api/escrow/lock`, `/api/escrow/release`

**Backend has:**
- M-Pesa payment model
- Payment table with references
- No Stellar integration visible

**Critical:** Need to clarify if Stellar escrow is planned or if M-Pesa is the payment method.

### 6. **Status Flow Mismatch**

**Frontend statuses:**
- pending → active → completed → cancelled

**Backend statuses:**
- pending → assigned → in_progress → completed → verified

**Issue:** Frontend has no "verified" state, backend has no "cancelled" state.

---

## Integration Requirements

### Phase 1: Backend API Expansion (Critical)

#### 1.1 Update Authentication Response
```python
# In email_auth.py - EmailPasswordLoginView
return Response({
    "access": str(refresh.access_token),
    "refresh": str(refresh),
    "user": {
        "id": user.id,
        "email": user.email,
        "phone_number": user.phone_number,
        "name": f"{user.first_name} {user.last_name}",
        "role": "employer" if user.user_type == "client" else "worker",
        "verified": True  # or add verification logic
    }
})
```

#### 1.2 Add GET /api/auth/me
```python
from rest_framework.permissions import IsAuthenticated

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "email": user.email,
            "phone_number": user.phone_number,
            "name": f"{user.first_name} {user.last_name}",
            "role": "employer" if user.user_type == "client" else "worker"
        })
```

#### 1.3 Add Worker Listing Endpoint
```python
class WorkerListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        search = request.GET.get('search', '')
        verified = request.GET.get('verified', None)
        
        workers = CustomUser.objects.filter(user_type='employee')
        
        if search:
            workers = workers.filter(
                Q(first_name__icontains=search) | 
                Q(last_name__icontains=search)
            )
        
        # Serialize workers
        data = [{
            "id": w.id,
            "name": f"{w.first_name} {w.last_name}",
            "phone": w.phone_number,
            "verified": True,  # Add verification logic
            "rating": 4.5,  # Calculate from tasks
            "reviewCount": 10  # Count from tasks
        } for w in workers]
        
        return Response({
            "data": data,
            "total": workers.count(),
            "page": 1,
            "pageSize": 20
        })
```

#### 1.4 Add Task/Contract CRUD Endpoints
```python
class TaskListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        if user.user_type == 'client':
            tasks = Task.objects.filter(client=user)
        elif user.user_type == 'employee':
            tasks = Task.objects.filter(status='pending') | Task.objects.filter(employee=user)
        else:
            tasks = Task.objects.all()
        
        data = [{
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "amount": float(t.price),
            "status": self.map_status(t.status),
            "employerId": t.client.id,
            "workerId": t.employee.id if t.employee else None,
            "createdAt": t.created_at.isoformat()
        } for t in tasks]
        
        return Response({"data": data})
    
    def post(self, request):
        if request.user.user_type != 'client':
            return Response({"error": "Only employers can create jobs"}, status=403)
        
        task = Task.objects.create(
            client=request.user,
            title=request.data['title'],
            description=request.data['description'],
            price=request.data['amount'],
            status='pending'
        )
        
        return Response({
            "id": task.id,
            "title": task.title,
            "status": "pending"
        }, status=201)
    
    @staticmethod
    def map_status(backend_status):
        mapping = {
            'pending': 'pending',
            'assigned': 'active',
            'in_progress': 'active',
            'completed': 'completed',
            'verified': 'completed'
        }
        return mapping.get(backend_status, 'pending')
```

#### 1.5 Add Task Detail & Update Endpoints
```python
class TaskDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, task_id):
        task = get_object_or_404(Task, id=task_id)
        # Return full task details
        
    def patch(self, request, task_id):
        task = get_object_or_404(Task, id=task_id)
        
        # Update status or assign employee
        if 'employee_id' in request.data:
            employee = get_object_or_404(CustomUser, id=request.data['employee_id'])
            task.employee = employee
            task.status = 'assigned'
            task.save()
        
        if 'status' in request.data:
            task.status = request.data['status']
            task.save()
        
        return Response({"message": "Updated"})
```

#### 1.6 Add Task Completion Endpoint
```python
class TaskCompleteView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, task_id):
        task = get_object_or_404(Task, id=task_id, client=request.user)
        
        if task.status != 'completed':
            return Response({"error": "Task not completed yet"}, status=400)
        
        task.status = 'verified'
        task.verified_at = timezone.now()
        task.save()
        
        # TODO: Trigger payment/escrow release
        
        return Response({
            "message": "Work completed and funds released",
            "job_id": task.id,
            "status": "verified"
        })
```

### Phase 2: Frontend Adaptation (Medium Priority)

#### 2.1 Update API Service Layer
```typescript
// frontend/services/api.ts
// Update all endpoint paths to match backend
// Update field names (amount → price, etc.)
// Add proper error handling
```

#### 2.2 Update TypeScript Types
```typescript
// frontend/types/index.ts
// Add 'verified' status
// Map backend user_type to frontend role
// Add missing fields
```

#### 2.3 Add CORS Configuration (Backend)
```python
# backend/settings.py
INSTALLED_APPS += ['corsheaders']
MIDDLEWARE.insert(0, 'corsheaders.middleware.CorsMiddleware')

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

### Phase 3: Escrow/Payment Integration (High Priority)

**Decision Required:**
1. **Option A:** Implement Stellar escrow (as frontend assumes)
2. **Option B:** Use M-Pesa only (update frontend docs)
3. **Option C:** Hybrid (M-Pesa deposit → Stellar escrow → M-Pesa payout)

**If Stellar:**
- Add Stellar SDK to backend
- Implement escrow contract creation
- Implement fund locking/releasing
- Add endpoints: `/api/escrow/lock`, `/api/escrow/release`

**If M-Pesa only:**
- Update frontend docs to remove Stellar references
- Implement M-Pesa STK Push for deposits
- Implement M-Pesa B2C for payouts
- Update frontend to show M-Pesa flow

---

## Recommended Implementation Order

### Week 1: Core API Endpoints
1. ✅ Add CORS support
2. ✅ Update auth response format
3. ✅ Add GET /api/auth/me
4. ✅ Add GET /api/workers
5. ✅ Add Task CRUD endpoints

### Week 2: Frontend Integration
1. ✅ Update API service layer
2. ✅ Update TypeScript types
3. ✅ Test authentication flow
4. ✅ Test task creation/listing
5. ✅ Test worker listing

### Week 3: Payment Integration
1. ⚠️ Decide on payment architecture
2. ⚠️ Implement chosen payment method
3. ⚠️ Add payment endpoints
4. ⚠️ Update frontend payment flow
5. ⚠️ End-to-end testing

### Week 4: Polish & Deploy
1. ✅ Error handling
2. ✅ Validation
3. ✅ Security audit
4. ✅ Performance testing
5. ✅ Documentation update

---

## Files to Create/Modify

### Backend
```
backend/product/
├── views.py (NEW - add all REST views)
├── serializers.py (UPDATE - add task serializers)
├── urls.py (UPDATE - add new endpoints)
└── permissions.py (NEW - custom permissions)

backend/backend/
└── settings.py (UPDATE - add CORS, REST framework config)
```

### Frontend
```
frontend/
├── services/api.ts (UPDATE - match backend endpoints)
├── types/index.ts (UPDATE - match backend models)
└── .env.local (CREATE - add backend URL)
```

---

## Testing Checklist

### Authentication
- [ ] Register employer via web
- [ ] Register worker via web
- [ ] Login with email
- [ ] Login with phone
- [ ] Get current user
- [ ] JWT token refresh

### Employer Flow
- [ ] Create job listing
- [ ] View own listings
- [ ] Search workers
- [ ] Assign worker to job
- [ ] Mark job complete
- [ ] Rate worker

### Worker Flow
- [ ] Browse available jobs
- [ ] View job details
- [ ] Accept job
- [ ] Update job status
- [ ] View earnings

### Payment Flow
- [ ] Deposit funds (M-Pesa/Stellar)
- [ ] Lock funds in escrow
- [ ] Release funds on completion
- [ ] View transaction history

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Payment architecture unclear | HIGH | Clarify with stakeholders immediately |
| Backend API incomplete | HIGH | Prioritize REST endpoint development |
| USSD vs Web priority conflict | MEDIUM | Maintain both interfaces |
| Data model mismatch | MEDIUM | Create mapping layer |
| No automated tests | HIGH | Add test suite before integration |

---

## Next Steps

1. **IMMEDIATE:** Clarify payment architecture (Stellar vs M-Pesa)
2. **IMMEDIATE:** Add CORS to backend
3. **DAY 1:** Implement core REST endpoints (auth, tasks, workers)
4. **DAY 2:** Update frontend API service layer
5. **DAY 3:** End-to-end testing
6. **DAY 4:** Payment integration
7. **DAY 5:** Production deployment

---

## Questions for Stakeholders

1. **Payment Method:** Stellar escrow, M-Pesa only, or hybrid?
2. **User Verification:** How should workers be verified?
3. **Admin Panel:** Web-based admin needed or USSD sufficient?
4. **Deployment:** Where will this be hosted?
5. **Mobile App:** Is a mobile app planned (React Native)?

---

**Document Status:** Draft for Review  
**Next Review:** After stakeholder meeting  
**Owner:** Development Team
