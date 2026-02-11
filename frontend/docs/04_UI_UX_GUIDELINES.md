# UI/UX Guidelines

## Design Principles

1. **Clarity**: Clear hierarchy, readable text, obvious actions
2. **Consistency**: Reuse components, maintain patterns
3. **Trust**: Professional appearance, secure indicators
4. **Accessibility**: Readable fonts, sufficient contrast, keyboard navigation

## Typography

### Font Family

- **Primary**: Inter (via next/font/google)
- **Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### Scale

- **Headings**:
  - H1: `text-5xl` (48px) - Hero titles
  - H2: `text-3xl` (30px) - Section titles
  - H3: `text-xl` (20px) - Card titles
- **Body**:
  - Large: `text-xl` (20px) - Subheadings
  - Regular: `text-base` (16px) - Body text
  - Small: `text-sm` (14px) - Labels, captions

## Color Palette

### Primary Colors

- **Blue** (Primary): `blue-600` (#2563eb)
  - Hover: `blue-700`
  - Light: `blue-50`, `blue-100`
- **Emerald** (Success): `emerald-500` (#10b981)
  - Hover: `emerald-600`
  - Light: `emerald-100`

### Neutral Colors

- **Gray** (Text/Borders):
  - Dark: `gray-900` (#111827) - Headings
  - Medium: `gray-600` (#4b5563) - Body text
  - Light: `gray-300` (#d1d5db) - Borders
  - Background: `gray-50` (#f9fafb)

### Status Colors

- **Success**: `emerald-500`
- **Warning**: `yellow-500`
- **Error**: `red-500`
- **Info**: `blue-500`

## Spacing

### Consistent Scale

- `gap-4` (16px) - Small gaps
- `gap-6` (24px) - Medium gaps
- `gap-8` (32px) - Large gaps
- `p-6` (24px) - Card padding
- `p-8` (32px) - Page padding

## Components

### Buttons

**Variants:**
- Primary: Blue background, white text
- Secondary: Emerald background, white text
- Outline: White background, gray border

**Sizes:**
- Default: `px-6 py-3`
- Rounded: `rounded-xl`

**States:**
- Hover: Darker shade
- Disabled: 50% opacity, no pointer

### Cards

- Background: White
- Border: `border border-gray-100`
- Rounded: `rounded-2xl`
- Shadow: `shadow-sm`
- Padding: `p-6`

### Badges

- Rounded: `rounded-full`
- Padding: `px-3 py-1`
- Font: `text-sm font-medium`
- Variants: success, warning, error, info, verified

### Inputs

- Border: `border border-gray-300`
- Rounded: `rounded-xl`
- Padding: `px-4 py-3`
- Focus: `ring-2 ring-blue-500`
- Error: `border-red-500`

## Layout

### Container

- Max width: `max-w-7xl`
- Centered: `mx-auto`
- Padding: `px-4 sm:px-6 lg:px-8`

### Grid

- Responsive: `grid md:grid-cols-2 lg:grid-cols-3`
- Gap: `gap-6` or `gap-8`

### Sidebar

- Width: `w-64` (256px)
- Background: White
- Border: `border-r border-gray-200`

## Icons

### Library

- **lucide-react** only
- Size: 20px (default), 24px (large), 32px (hero)

### Common Icons

- Dashboard: `LayoutDashboard`
- Jobs: `Briefcase`
- Users: `Users`
- Security: `Shield`
- Success: `CheckCircle`
- Search: `Search`
- Location: `MapPin`

## Responsive Design

### Breakpoints

- Mobile: Default (< 768px)
- Tablet: `md:` (≥ 768px)
- Desktop: `lg:` (≥ 1024px)

### Mobile-First

```tsx
// Stack on mobile, grid on desktop
<div className="grid md:grid-cols-2 gap-6">
```

### Hide/Show

```tsx
// Hide on mobile, show on desktop
<div className="hidden md:flex">
```

## Interaction States

### Hover

- Buttons: Darker background
- Links: Underline or color change
- Cards: Subtle shadow increase

### Focus

- Inputs: Blue ring (`ring-2 ring-blue-500`)
- Buttons: Blue ring
- Links: Blue ring

### Active

- Sidebar links: Blue background (`bg-blue-50`), blue text

### Disabled

- Opacity: 50%
- Cursor: `cursor-not-allowed`
- No hover effects

## Accessibility

### Contrast

- Text on white: `gray-900` (AAA)
- Secondary text: `gray-600` (AA)
- Borders: `gray-300` (visible)

### Focus Indicators

- Always visible
- Blue ring for keyboard navigation

### Semantic HTML

- Use `<button>` for actions
- Use `<a>` for navigation
- Use proper heading hierarchy

### Labels

- All inputs have labels
- Use `aria-label` for icon buttons

## Animation

### Transitions

- Duration: `transition-colors` (150ms)
- Easing: Default (ease)
- Properties: colors, opacity

### No Complex Animations

- Keep it simple and fast
- Avoid distracting motion

## Empty States

### Structure

- Icon (gray-400)
- Title (gray-900)
- Description (gray-600)
- Action button (optional)

### Example

```tsx
<EmptyState
  icon={<Briefcase size={48} />}
  title="No jobs yet"
  description="Start by posting your first job"
  action={<Button>Post a Job</Button>}
/>
```

## Loading States

### Skeleton Screens

- Use gray-200 backgrounds
- Animate with pulse

### Spinners

- Use for async actions
- Center in container

## Error States

### Inline Errors

- Red text (`text-red-600`)
- Below input field
- Clear, actionable message

### Page Errors

- Centered layout
- Error icon
- Clear message
- Action to resolve

## Best Practices

1. **Consistency**: Use existing components
2. **Whitespace**: Don't cram content
3. **Hierarchy**: Clear visual importance
4. **Feedback**: Show loading/success/error states
5. **Mobile**: Test on small screens
6. **Accessibility**: Keyboard navigation, screen readers
7. **Performance**: Optimize images, lazy load
