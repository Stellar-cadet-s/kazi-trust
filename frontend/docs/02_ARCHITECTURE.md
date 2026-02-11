# Architecture Documentation

## Technology Stack

### Frontend
- **Framework**: Next.js 16.1.6
- **Router**: App Router (not Pages Router)
- **Language**: TypeScript 5.x (strict mode)
- **Styling**: Tailwind CSS 4.x
- **Icons**: lucide-react
- **Font**: Inter (next/font/google)

### Backend (Separate)
- Django REST Framework
- Stellar SDK (Python)
- PostgreSQL

## Folder Structure

```
frontend/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page
│   ├── globals.css              # Global styles
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── employer/
│   │   ├── layout.tsx           # Employer sidebar layout
│   │   ├── dashboard/page.tsx
│   │   ├── contracts/new/page.tsx
│   │   ├── workers/page.tsx
│   │   └── rights/page.tsx
│   └── worker/
│       ├── layout.tsx           # Worker sidebar layout
│       ├── dashboard/page.tsx
│       ├── browse/page.tsx
│       └── rights/page.tsx
├── components/
│   ├── ui/                      # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Input.tsx
│   │   ├── Textarea.tsx
│   │   ├── EmptyState.tsx
│   │   └── index.ts
│   └── layout/                  # Layout components
│       ├── Navbar.tsx
│       ├── Sidebar.tsx
│       ├── Container.tsx
│       ├── PageHeader.tsx
│       └── index.ts
├── services/
│   └── api.ts                   # Centralized API calls
├── types/
│   └── index.ts                 # TypeScript types
├── docs/                        # Documentation
└── .env.example                 # Environment template
```

## Component Architecture

### UI Components (`components/ui/`)

Reusable, stateless components with consistent styling:

- **Button**: Primary, secondary, outline variants
- **Card**: Container with rounded corners and shadow
- **Badge**: Status indicators (success, warning, error, verified)
- **Input/Textarea**: Form inputs with labels and error states
- **EmptyState**: Placeholder for empty lists

### Layout Components (`components/layout/`)

- **Navbar**: Public pages navigation
- **Sidebar**: Dashboard navigation (employer/worker)
- **Container**: Max-width wrapper for content
- **PageHeader**: Consistent page titles with actions

## Routing Strategy

### App Router (Next.js 13+)

- File-based routing under `app/`
- Layouts for shared UI (sidebar)
- Server Components by default
- Client Components marked with `'use client'`

### Route Groups

- `(public)` - Landing page (no layout)
- `employer/` - Employer dashboard (sidebar layout)
- `worker/` - Worker dashboard (sidebar layout)
- `auth/` - Authentication pages (centered layout)

## Data Flow

```
User Action
    ↓
Component Event Handler
    ↓
Service Layer (services/api.ts)
    ↓
HTTP Request to Backend
    ↓
Django REST API
    ↓
Business Logic + Stellar Escrow
    ↓
Database + Blockchain
    ↓
JSON Response
    ↓
Service Layer
    ↓
Component State Update
    ↓
UI Re-render
```

## State Management

- **Local State**: React useState for form inputs
- **Server State**: Fetch data in Server Components
- **Client State**: Client Components for interactivity
- **No Global State**: Keep it simple, fetch on demand

## API Integration

### Service Layer Pattern

All API calls centralized in `services/api.ts`:

```typescript
export const contractService = {
  list: () => fetchAPI<PaginatedResponse<Contract>>('/api/contracts'),
  create: (data) => fetchAPI('/api/contracts', { method: 'POST', body: JSON.stringify(data) }),
};
```

### Type Safety

All API responses typed in `types/index.ts`:

```typescript
export interface Contract {
  id: string;
  title: string;
  amount: number;
  status: 'pending' | 'active' | 'completed';
}
```

## Styling System

### Tailwind Configuration

- Content paths: `app/**/*.{ts,tsx}`, `components/**/*.{ts,tsx}`
- Custom theme: Inter font, blue/emerald colors
- No custom CSS (Tailwind only)

### Design Tokens

- **Spacing**: Consistent padding/margin (4, 6, 8)
- **Borders**: rounded-xl (12px), rounded-2xl (16px)
- **Shadows**: shadow-sm (subtle)
- **Colors**: blue-600 (primary), emerald-500 (success), gray-50 (background)

## Security Considerations

### Frontend Responsibilities

- ✅ Input validation (client-side)
- ✅ Display data securely
- ✅ Handle authentication tokens
- ✅ Call backend APIs

### Backend Responsibilities

- ✅ Business logic validation
- ✅ Stellar transaction building
- ✅ Escrow management
- ✅ Database operations
- ✅ Authentication/authorization

### What Frontend NEVER Does

- ❌ Build Stellar transactions
- ❌ Handle private keys
- ❌ Implement escrow logic
- ❌ Direct blockchain interaction

## Performance Optimization

- Server Components for static content
- Client Components only when needed
- Image optimization with next/image
- Font optimization with next/font
- Code splitting (automatic with App Router)

## Testing Strategy

- TypeScript for compile-time checks
- ESLint for code quality
- Manual testing in development
- Build verification before deployment

## Deployment

### Build Process

```bash
npm run lint
npm run typecheck
npm run build
```

### Environment Variables

- `NEXT_PUBLIC_API_BASE_URL` - Backend API URL
- Set in `.env.local` (dev) or deployment platform (prod)

### Production Checklist

- [ ] All TypeScript errors resolved
- [ ] ESLint passes
- [ ] Build completes successfully
- [ ] Environment variables configured
- [ ] Backend API accessible
