# io-services-cms-backoffice

Next.js (pages router) app for IO Services CMS Backoffice.

## Scope

This file applies to `apps/backoffice`.
Root rules in `../../AGENTS.md` still apply; this file adds backoffice-specific guidance.

## Structure

| Directory        | Purpose                                          |
| ---------------- | ------------------------------------------------ |
| `src/pages`      | Next.js pages and route entry points             |
| `src/app/api`    | BFF API routes                                   |
| `src/lib/be`     | Backend-for-frontend business logic              |
| `src/components` | UI components                                    |
| `src/hooks`      | React hooks                                      |
| `src/config`     | Runtime configuration and typed env access       |
| `src/__tests__`  | Test suite                                       |
| `mocks`          | MSW handlers and setup files for local/dev tests |
| `public/locales` | i18n translation dictionaries (`it`, `en`)       |

## Common Commands

```bash
pnpm --filter io-services-cms-backoffice dev                   # run backoffice in dev mode
pnpm --filter io-services-cms-backoffice build                 # build the app
pnpm --filter io-services-cms-backoffice lint                  # lint src/**
pnpm --filter io-services-cms-backoffice test:b4f              # run BFF tests (node config)
pnpm --filter io-services-cms-backoffice test:fe               # run FE tests (react config)
pnpm --filter io-services-cms-backoffice coverage              # run coverage (BFF + FE)
pnpm --filter io-services-cms-backoffice generate:api-definitions     # generate clients from backoffice openapi
pnpm --filter io-services-cms-backoffice generate:services-cms         # generate clients from cms-webapp openapi
pnpm --filter io-services-cms-backoffice generate:selfcare-api-models  # generate selfcare API models
```

## Golden Rules (Backoffice)

- Keep BFF boundaries clear: place API routes in `src/app/api` and business logic in `src/lib/be`.
- Read environment variables through typed config modules; avoid direct env access in app logic.
- Validate external data at boundaries before using it in domain or UI logic.
- Use `@/*` for imports from `src/*` (`@/*` -> `./src/*` in `tsconfig.json`).

### Frontend

- Use `src/hooks/use-fetch.ts` as the standard frontend data-fetching wrapper.
- Use `@pagopa/mui-italia` and `@mui/material` as UI libraries.
- Use `next-i18next` with Italian (`it`) as default locale and English (`en`) as secondary; keep translations in `public/locales/`.
- Use `react-hook-form` + `zod` for managing forms.

## Testing

- Use `test:b4f` for server-side/BFF logic and `test:fe` for React/UI logic.
- Prefer targeted tests on touched areas before running full coverage.

## Mocking (MSW)

- Use MSW v2 for local development and tests.
- Keep handlers and setup files in `mocks/`.
- Use `mocks/msw-vitest.ts` as the Vitest setup file for BFF tests.
- Enable mocking via env flags (for example `IS_MSW_ENABLED`, `NEXT_PUBLIC_IS_MSW_ENABLED`).
