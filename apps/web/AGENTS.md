# Development workflow
- Install dependencies with `npm install`.
- Use `npm run lint` before committing.
- Run `npm test` (Jest) to execute unit tests in `src/lib/utils/__tests__`.

# Coding style
- TypeScript everywhere (`.ts` / `.tsx`).
- Follow the path aliases defined in `tsconfig.json`:
  - `@components/*` → `src/components/*`
  - `@lib/*` → `src/lib/*`
  - `@maratypes/*` → `src/maratypes/*`
  - `@hooks/*` → `src/hooks/*`
- Prefer functional React components.
- Keep Prisma models in sync with TypeScript types.

# Adding tests
- Place new tests under `src/lib/utils/__tests__/` or `src/lib/api/__tests__/` and so on. 
- Test helper functions individually (see existing small Jest tests).
- Run `npm test` locally and ensure all suites pass.

# Pull requests
- Provide concise, descriptive PR titles.
- Include a summary of changes and note any new scripts or environment variables.
- Confirm `npm run lint` and `npm test` succeed in the PR body.

# Environment
- Prisma uses `DATABASE_URL` from `.env`; create this file locally with
  your PostgreSQL connection string.


# UI & Styling Guidelines

- We use [shadcn/ui](https://ui.shadcn.com) for all core UI components (buttons, dialogs, cards, etc.). Prefer these over custom-styled HTML elements.
- Icons come from `lucide-react`. All components should use `Lucide` icons instead of SVGs or other icon libraries.
- Use Tailwind utility classes for layout and spacing. Layout wrappers should use `container mx-auto px-4 max-w-screen-lg` for consistent structure.
- Typography follows Tailwind scale (`text-base`, `text-xl`, etc.) and uses a Google Font imported via `next/font/google`.
- Design tokens:
  - Rounded corners: use `rounded-md` or `rounded-2xl`.
  - Shadows: use `shadow-sm`, `shadow-md`, or `shadow-lg` for visual depth.
  - Colors: use the extended color palette in `tailwind.config.js` (3 primary shades and 1 accent).
- Install and configure:
  - `@tailwindcss/typography` for rich content
  - `@tailwindcss/forms` for styled inputs
- Add new UI components under `src/components/ui/` when building shared widgets.
- Always ensure components are responsive and keyboard-accessible.
- Use `opacity-##` for instead of slash opacity.
- For feedback and notifications, use `Toast` or `sonner` (via `shadcn/ui`).
- For coloring here are the colors you can use:
```ts
colors: {
  background: "var(--background)",
  foreground: "var(--foreground)",
  muted: "var(--muted)",
  "muted-foreground": "var(--muted-foreground)",
  primary: "var(--primary)",
  secondary: "var(--secondary)",
  accent: "var(--accent)",
  "accent-2": "var(--accent-2)",
  "accent-3": "var(--accent-3)",
  "accent-foreground": "var(--accent-foreground)",
  "brand-from": "var(--brand-from)",
  "brand-to": "var(--brand-to)",
  "brand-orange": "var(--brand-orange)",
  "brand-blue": "var(--brand-blue)",
  "brand-purple": "var(--brand-purple)",
  "brand-orange-dark": "var(--brand-orange-dark)",
}
```
