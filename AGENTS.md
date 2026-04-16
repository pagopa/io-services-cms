# io-services-cms Monorepo

pnpm 10 + Turborepo monorepo for IO Services CMS. Requires Node (version specified in `.node-version`).

## Structure

| Directory                         | Purpose                                                                |
| --------------------------------- | ---------------------------------------------------------------------- |
| `apps/io-services-cms-webapp`     | CMS backend — Azure Functions v4; queue-driven service lifecycle flows |
| `apps/backoffice`                 | Service management UI — Next.js (pages router) with BFF APIs           |
| `apps/app-backend`                | Read-only public API for IO app users — Azure Functions v4             |
| `packages/io-services-cms-models` | Shared domain models and FSM framework                                 |
| `packages/external-clients`       | External API and APIM client wrappers                                  |
| `packages/fetch-utils`            | Shared HTTP/fetch utilities                                            |
| `docs`                            | Technical and operational documentation                                |
| `infra`                           | Terraform infrastructure and deployment resources                      |

## Common Commands

```bash
pnpm install                                   # install dependencies
pnpm build                                     # build all packages/apps
pnpm lint                                      # lint all packages/apps
pnpm test                                      # run unit tests across workspace
pnpm format                                    # format all packages/apps
pnpm generate                                  # generate artifacts across workspace
pnpm code-review                               # run typecheck + lint + coverage gate
pnpm --filter io-services-cms-backoffice dev   # run backoffice in dev mode
```

## Golden Rules

- Never manually edit generated files under `src/generated/`.
- Avoid `fp-ts` in new code; use native TypeScript.
- Replace `fp-ts` with native TypeScript when modifying existing code.
- Never read `process.env` directly in app logic.
- Keep changes focused; do not refactor unrelated code.
- Validate all external data via `io-ts` codecs.
- Propose pinning shared dependencies in the workspace catalog when they are not catalog-pinned yet (see [Dependencies](#dependencies)).
- Comment non-obvious decisions; explain WHY, not WHAT.

## Dependencies

- Shared dependency versions are pinned in `pnpm-workspace.yaml` (`catalog:`).
- In `package.json`, use `catalog:` versions when the dependency is already catalog-pinned.
