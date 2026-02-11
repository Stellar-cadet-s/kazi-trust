# TrustWork Frontend - Overview

## Project Summary

TrustWork is a blockchain-powered platform connecting domestic workers with employers through secure, transparent contracts backed by Stellar escrow.

## Architecture

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind
- **Backend**: Django REST API
- **Blockchain**: Stellar (server-side only)
- **Database**: PostgreSQL (backend)

## Key Principles

1. **Backend-Ready**: Frontend is a pure UI layer with no business logic
2. **Type-Safe**: Full TypeScript coverage with strict mode
3. **Component Reuse**: Single source of truth for UI components
4. **API-First**: All data operations through centralized service layer
5. **Security**: No sensitive operations in frontend

## User Roles

### Employer
- Post jobs
- Find verified workers
- Manage contracts
- Release payments (via backend escrow)

### Worker
- Browse jobs
- Apply to contracts
- Track earnings
- Receive secure payments

## Payment Flow

1. Employer posts job with payment amount
2. Worker accepts contract
3. **Backend** locks funds in Stellar escrow
4. Worker completes job
5. Employer confirms completion
6. **Backend** releases funds from escrow to worker

**CRITICAL**: All Stellar transactions happen server-side. Frontend only triggers API calls.

## Design System

- **Typography**: Inter font family
- **Colors**: Blue (primary), Emerald (success), Gray (neutral)
- **Components**: Rounded corners (xl/2xl), subtle shadows, clean spacing
- **Layout**: Sidebar navigation for dashboards, responsive grid

## Development Workflow

1. Create feature branch from `trunk`
2. Implement changes
3. Run quality checks (lint, typecheck, build)
4. Commit with professional message
5. Push feature branch
6. Merge to `trunk` (no-ff)
7. Keep feature branch (do not delete)

## Documentation Structure

- `00_OVERVIEW.md` - This file
- `01_SETUP.md` - Installation and setup
- `02_ARCHITECTURE.md` - Technical architecture
- `03_API_CONTRACT.md` - Backend API endpoints
- `04_UI_UX_GUIDELINES.md` - Design guidelines
- `STRICT_RULES.md` - Critical constraints
- `system-architecture.mmd` - System diagram
