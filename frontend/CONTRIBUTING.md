# Contributing to TrustWork Frontend

## Getting Started

1. Read [docs/01_SETUP.md](./docs/01_SETUP.md)
2. Read [docs/STRICT_RULES.md](./docs/STRICT_RULES.md)
3. Set up development environment

## Development Workflow

### 1. Create Feature Branch

```bash
git checkout trunk
git pull --ff-only
git checkout -b feat/your-feature-name
```

Branch naming:
- `feat/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation
- `refactor/` - Code refactoring

### 2. Make Changes

- Follow existing code patterns
- Reuse components from `components/ui/`
- Use Tailwind CSS only (no inline styles)
- Add types for new data structures

### 3. Test Locally

```bash
npm run dev
```

Test in browser:
- Desktop view
- Mobile view (responsive)
- All user flows

### 4. Quality Checks

```bash
npm run lint
npm run typecheck
npm run build
```

All must pass before committing.

### 5. Commit

```bash
git add .
git commit -m "feat: add user profile page"
```

Commit message format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `refactor:` - Code refactoring
- `style:` - Formatting
- `test:` - Tests

### 6. Push Feature Branch

```bash
git push origin feat/your-feature-name
```

### 7. Merge to Trunk

```bash
git checkout trunk
git pull --ff-only
git merge --no-ff feat/your-feature-name -m "merge: user profile page" -m "Added profile view, edit form, and avatar upload"
git push origin trunk
```

**Do NOT delete feature branches.**

## Code Standards

### TypeScript

- Strict mode enabled
- No `any` types (use `unknown` if needed)
- Explicit return types for functions
- Interface over type for objects

### Components

- Functional components only
- Use `forwardRef` for ref forwarding
- Props interface above component
- Export at bottom

Example:
```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  children: ReactNode;
}

export function Button({ variant = 'primary', children }: ButtonProps) {
  return <button className={...}>{children}</button>;
}
```

### Styling

- Tailwind utility classes only
- No inline styles
- Consistent spacing (4, 6, 8)
- Responsive design (mobile-first)

### File Organization

- One component per file
- Index files for exports
- Co-locate related files

## Component Guidelines

### Creating New Components

1. Check if similar component exists
2. If yes, extend existing component
3. If no, create in appropriate folder:
   - `components/ui/` - Reusable UI elements
   - `components/layout/` - Layout components

### Component Checklist

- [ ] TypeScript interface for props
- [ ] Tailwind styling (no inline styles)
- [ ] Responsive design
- [ ] Accessibility (labels, ARIA)
- [ ] Reusable (no hardcoded values)
- [ ] Exported in index.ts

## API Integration

### Service Layer

All API calls in `services/api.ts`:

```typescript
export const userService = {
  get: (id: string) => fetchAPI<User>(`/api/users/${id}`),
};
```

### Types

Define response types in `types/index.ts`:

```typescript
export interface User {
  id: string;
  name: string;
  email: string;
}
```

### Error Handling

```typescript
try {
  const data = await userService.get(id);
} catch (error) {
  // Handle error
}
```

## Documentation

### When to Update Docs

- New API endpoints → `docs/03_API_CONTRACT.md`
- New components → Add to `docs/02_ARCHITECTURE.md`
- Design changes → Update `docs/04_UI_UX_GUIDELINES.md`

### Documentation Standards

- Clear, concise language
- Code examples
- Screenshots for UI changes

## Testing

### Manual Testing

- Test all user flows
- Test responsive design
- Test error states
- Test loading states

### Build Testing

```bash
npm run build
npm run start
```

Verify production build works.

## Pull Request Guidelines

### Before Creating PR

- [ ] All quality checks pass
- [ ] Tested locally
- [ ] Documentation updated
- [ ] No console errors
- [ ] Responsive design verified

### PR Description

Include:
- What changed
- Why it changed
- How to test
- Screenshots (for UI changes)

## Common Issues

### TypeScript Errors

```bash
npm run typecheck
```

Fix all errors before committing.

### ESLint Errors

```bash
npm run lint
```

Auto-fix:
```bash
npx eslint --fix .
```

### Build Failures

```bash
rm -rf .next
npm run build
```

## Questions?

- Check documentation in `docs/`
- Review existing code patterns
- Ask in team chat

## Code Review

### What We Look For

- Code quality
- Type safety
- Component reuse
- Tailwind usage
- Responsive design
- Accessibility
- Documentation

### Review Process

1. Automated checks (lint, typecheck, build)
2. Code review by team member
3. Test in staging environment
4. Merge to trunk

## License

By contributing, you agree to the project license.
