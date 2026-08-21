# Hazem Alabiad Portfolio Guidelines

This repository relies on specific architectural choices and styling requirements to maintain its aesthetic and functionality. When contributing or generating code for this repository, please adhere to the following guidelines:

## 1. Package Manager

- **Strictly use `pnpm`**: Do not use `npm` or `yarn`. The CI/CD pipelines (GitHub Actions) rely heavily on `pnpm-lock.yaml` for frozen lockfile installations. Using `npm` will create a `package-lock.json` and cause build failures.

## 2. Design System & CSS

- **Dynamic Theming**: The portfolio features a dynamic light/dark mode switch. **Never** hardcode background colors (e.g. `#121212` or `rgba(0,0,0,0.8)`). Always use the predefined CSS variables from `theme.css` (e.g. `var(--bg-panel)`, `var(--bg-elevated)`, `var(--ink)`) so that components naturally flip between light and dark themes.
- **Tactile UX**: All interactive elements (buttons, cards) must have an `:active` depressed state (e.g., `transform: scale(0.98)` or `scale(0.96)`) to ensure the site feels premium and responsive.
- **Glassmorphism**: When implementing floating panels or terminal windows, utilize `-webkit-backdrop-filter` and heavy shadows instead of flat background colors to maintain the macOS-like aesthetic.

## 3. Testing

- The testing suite relies on **Vitest** and **React Testing Library**.
- All unit tests should be run using `pnpm test`.
- Aim for high test coverage, as Codecov is integrated into the PR workflow.

