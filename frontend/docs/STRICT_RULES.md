# STRICT RULES

## CRITICAL CONSTRAINTS

### 1. NO STELLAR LOGIC IN FRONTEND
- ❌ NEVER build Stellar transactions in frontend
- ❌ NEVER handle private keys in frontend
- ❌ NEVER implement escrow logic in frontend
- ✅ ALL Stellar operations are server-side only
- ✅ Frontend only calls backend API endpoints

### 2. NO CODE DUPLICATION
- ✅ Use components from `components/ui/`
- ✅ Use layout components from `components/layout/`
- ❌ Do NOT create inline duplicate components
- ❌ Do NOT copy-paste component code

### 3. TAILWIND ONLY
- ✅ Use Tailwind utility classes
- ❌ NO inline styles
- ❌ NO CSS modules
- ❌ NO styled-components

### 4. TYPE SAFETY
- ✅ TypeScript strict mode enabled
- ✅ All API responses typed in `types/`
- ✅ No `any` types without justification
- ✅ Run `npm run typecheck` before commit

### 5. API SERVICE LAYER
- ✅ All API calls in `services/api.ts`
- ❌ NO fetch calls in page components
- ✅ Use centralized error handling
- ✅ Document all endpoints in `docs/03_API_CONTRACT.md`

### 6. GIT WORKFLOW
- ✅ Feature branches for all changes
- ✅ Merge target is ALWAYS `trunk` (never main)
- ✅ Do NOT delete feature branches after merge
- ✅ Professional commit messages

### 7. BUILD CHECKS
Run before every commit:
```bash
npm run lint
npm run typecheck
npm run build
```

### 8. NEXT.JS VERSION
- ✅ Current version: 16.1.6
- ❌ Do NOT upgrade Next.js without approval
- ✅ Use App Router only (no pages router)

### 9. FOLDER STRUCTURE
- ✅ All frontend code in `frontend/`
- ✅ All docs in `frontend/docs/`
- ❌ Do NOT create other top-level folders

### 10. SECURITY
- ❌ NO credentials in code
- ❌ NO API keys in frontend
- ✅ Use environment variables
- ✅ Validate all user input
