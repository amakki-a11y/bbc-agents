# Frontend Testing Infrastructure

This project uses **Vitest** and **React Testing Library** for frontend testing.

## Setup
Testing dependencies are installed in `client/package.json`:
- `vitest`: Test runner
- `@testing-library/react`: React component testing utilities
- `@testing-library/jest-dom`: DOM matchers
- `jsdom`: Browser environment for tests

## Configuration
- `vite.config.js`: Updated to support Vitest
- `vitest.config.js`: Configuration for Vitest (environment, setup files)
- `src/test/setup.js`: Global setup (extends jest-dom matchers)

## Running Tests
Run the following commands from the `client/` directory:

```bash
# Run tests once
npm run test -- --run

# Run tests in watch mode (development)
npm run test

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## Writing Tests
- Place test files alongside components (e.g., `Login.test.jsx`) or in `__tests__` directories.
- Use `.test.jsx` or `.spec.jsx` extensions.
- Import `render`, `screen` from `@testing-library/react`.
- Import `describe`, `it`, `expect` from `vitest`.
