# Setup Guide

## Prerequisites

- Node.js 20+ and npm
- Git
- Backend API running (Django)

## Initial Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd kazi-trust/frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### 4. Verify Installation

```bash
npm run lint
npm run typecheck
npm run build
```

All commands should complete without errors.

## Development

### Start Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript compiler

## Git Workflow

### Create Feature Branch

```bash
git checkout trunk
git pull --ff-only
git checkout -b feat/your-feature-name
```

### Make Changes

1. Edit files
2. Test locally
3. Run quality checks

### Commit Changes

```bash
git add .
git commit -m "feat: add user authentication flow"
```

### Push Feature Branch

```bash
git push origin feat/your-feature-name
```

### Merge to Trunk

```bash
git checkout trunk
git pull --ff-only
git merge --no-ff feat/your-feature-name -m "merge: user authentication flow" -m "Implemented login, register, and session management"
git push origin trunk
```

**Do NOT delete feature branches after merge.**

## Quality Checks

Run before every commit:

```bash
npm run lint && npm run typecheck && npm run build
```

## Troubleshooting

### Port 3000 Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### Module Not Found

```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
npm run typecheck
```

Fix all errors before committing.

## IDE Setup

### VS Code Extensions

- ESLint
- Tailwind CSS IntelliSense
- TypeScript and JavaScript Language Features

### Settings

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```
