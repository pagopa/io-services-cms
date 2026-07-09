# AGENTS.md

Guidance for AI coding agents working in **io-services-cms** — a PagoPA monorepo that manages the lifecycle and publication of IO app Services.

See [README.md](README.md) for the product overview and [docs/terraform-development.md](docs/terraform-development.md) for infrastructure work.

## Monorepo layout

pnpm workspace + [Turbo](turbo.json) task orchestration. TypeScript everywhere, heavy `fp-ts` / `io-ts` functional style.

- `apps/io-services-cms-webapp/` — **core CMS** Azure Functions. Service lifecycle FSM, Event Hub watchers, PostgreSQL + Cosmos DB. Exposes [openapi.yaml](apps/io-services-cms-webapp/openapi.yaml).
- `apps/app-backend/` — Azure Functions serving the IO app (featured/search/detail) via Cosmos DB, Azure AI Search, Blob Storage. Uses `@pagopa/handler-kit`.
- `apps/backoffice/` — Next.js 15 admin dashboard (BFF pattern, NextAuth, MUI + `@pagopa/mui-italia`). See [README](apps/backoffice/README.md).
- `packages/io-services-cms-models/` — domain models + the `ServiceLifecycle` / `ServicePublication` finite state machines. Consumed by all apps.
- `packages/external-clients/` — APIM + Selfcare clients. `packages/fetch-utils/` — HTTP agent utilities. `packages/utilities/` — private ops scripts.
- `infra/` — Terraform IaC (`src/` = envs, `resources/_modules/` = reusable modules). `.identity/` wires GitHub runners.

## Essential commands

Run from the repo root (Turbo fans out to workspaces). Package manager is **pnpm** (`pnpm install` first).

- `pnpm build` — compile all (`generate` → `^build` → `build`).
- `pnpm test` — Vitest unit tests. `pnpm test:integrations` for integration suites.
- `pnpm lint` / `pnpm format` — ESLint (`@pagopa/eslint-config`) / Prettier.
- `pnpm code-review` — runs `typecheck lint coverage`; this is what CI enforces.
- `pnpm generate` — regenerate code from OpenAPI/Avro specs (see below).

Scope to one workspace with `pnpm --filter <pkg-name> <script>` (name = `package.json` `name`, e.g. `io-services-cms-webapp`). App-specific scripts (`start`, `dev`, per-app tests) live in each app's `package.json`.

## Codegen — never hand-edit generated files

`src/generated/**` is produced by `pnpm generate` and must not be edited manually. Change the source spec, then regenerate:

- OpenAPI → TS via `@pagopa/openapi-codegen-ts` (`gen-api-models`). Specs: each app's/package's `openapi.yaml`.
- `io-services-cms-webapp` also generates **Avro** Event Hub types (`generate:avro`, source in `avro/`).
- `backoffice` runs multiple codegen passes (own API, services-cms API, Selfcare API).

Turbo makes `build`/`test`/`typecheck` depend on `generate`, so run generate after touching a spec.

## Conventions

- **Functional core**: business logic uses `fp-ts` (`ReaderTaskEither` for DI + async errors) and `io-ts` codecs for runtime validation. Config is parsed/validated through io-ts in each app's `config.ts` — add new env vars there.
- **Azure Functions**: handlers live in `webservice/controllers/` (webapp) or `functions/` (app-backend); Event Hub triggers in `watchers/`. Bootstrap + DI wiring is in `main.ts`.
- **Domain state** flows through the `ServiceLifecycle` FSM in `packages/io-services-cms-models`; prefer reusing it over ad-hoc state logic.
- **Dual runtime config** (webapp): Managed Identity in prod vs connection strings locally — keep both paths working when editing `config.ts`.
- **Local dev**: copy `local.settings.json.example` → `local.settings.json`; `pnpm --filter <app> start` runs the Functions emulator, `pnpm --filter io-services-cms-backoffice dev` runs Next.js. Postgres migrations use Flyway scripts in `apps/io-services-cms-webapp/db/scripts/`.

## Testing

- Uses **Vitest** (not Jest) across all packages and apps.
- Tests live in `__tests__/` directories alongside the code they test, with `.test.ts` suffixes.
- `backoffice` splits Node/BFF tests (`test:b4f`) from React tests (`test:fe`) via separate Vitest configs.

## Quality gates & git

- **Perform linting**: after modifying any `apps/**` or `packages/**` workspace, always run lint on the affected workspaces (`pnpm --filter <pkg-name> lint`).
- **Pre-commit hooks**: after modifying IaC under `infra/src/**`, always run linting and formatting with `pre-commit run -a` (config: [.pre-commit-config.yaml](.pre-commit-config.yaml)).
- **Git operations**: avoid executing `git add`, `git commit`, or `git push` in scripts to prevent side effects. Scripts should output the necessary changes and let developers review and stage them manually.

## Changesets & PRs

- User-facing changes to published packages require a changeset: `pnpm changeset` (base branch is `master`).
- CI (`code-review.yaml`) runs typecheck/lint/coverage on `apps/**` and `packages/**`; keep `pnpm code-review` green before pushing.
- Respect [CODEOWNERS](CODEOWNERS) — backoffice, infra bootstrapper and other paths have specific reviewers.

## Infrastructure

Terraform is run via [infra/src/terraform.sh](infra/src/terraform.sh) (`./terraform.sh plan prod`). Pre-commit hooks enforce `fmt`/`tflint`/`validate`/`trivy`. **Read [docs/terraform-development.md](docs/terraform-development.md) before changing infra** (tfenv version pinning, multi-platform lock files, drift detection).
