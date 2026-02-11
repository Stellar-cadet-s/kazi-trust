# TrustWork Frontend

Production-grade Next.js frontend for TrustWork - a blockchain-powered domestic work platform.

## Tech Stack

- **Framework**: Next.js 16.1.6 (App Router)
- **Language**: TypeScript 5.x (strict mode)
- **Styling**: Tailwind CSS 4.x
- **Icons**: lucide-react
- **Backend**: Django REST API + Stellar escrow

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- Backend API running on `http://localhost:8000`

### Installation

```bash
npm install
```

### Environment Setup

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build & Quality Checks

```bash
npm run lint        # ESLint
npm run typecheck   # TypeScript
npm run build       # Production build
```

## Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── (public)/          # Public landing page
│   ├── auth/              # Login/Register
│   ├── employer/          # Employer dashboard
│   └── worker/            # Worker dashboard
├── components/
│   ├── ui/                # Reusable UI components
│   └── layout/            # Layout components
├── services/              # API service layer
├── types/                 # TypeScript types
└── docs/                  # Documentation
```

## Key Features

- ✅ Responsive design (mobile-first)
- ✅ Type-safe API layer
- ✅ Reusable component library
- ✅ Role-based routing (Employer/Worker)
- ✅ Backend-ready (no Stellar logic in frontend)

## Routes

### Public
- `/` - Landing page
- `/auth/login` - Login
- `/auth/register` - Register

### Employer
- `/employer/dashboard` - Overview
- `/employer/contracts/new` - Post job
- `/employer/workers` - Find workers
- `/employer/rights` - Rights info

### Worker
- `/worker/dashboard` - Overview
- `/worker/browse` - Browse jobs
- `/worker/rights` - Rights info

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)

## License

See [LICENSE](./LICENSE)
