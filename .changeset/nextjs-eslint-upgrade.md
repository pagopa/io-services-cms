---
"io-services-cms-backoffice": minor
"@io-services-cms/models": patch
"io-services-cms-webapp": patch
---

Upgrade Next.js to v15, next-auth to v5 (Auth.js), and ESLint to v9

### backoffice
- Upgraded Next.js from 14 to 15; applied codemods for async Request APIs
- Migrated next-auth from v4 to v5 (Auth.js); updated `NEXTAUTH_*` env vars to `AUTH_*`
- Upgraded ESLint from v8 to v9; migrated to flat config (`eslint.config.mjs`) with FlatCompat bridge
- Pinned `@pagopa/eslint-config` to `^4.0.6` (typescript-eslint@8, compatible with ESLint 9)
- Fixed all lint errors: `ban-types` → `() => void`, `no-var-requires` → `no-require-imports`, typed `GetStaticProps`/`GetServerSideProps`, removed stale disable comments
- Added webpack externals for `@azure/functions-core` and `@opentelemetry/exporter-jaeger` to suppress optional-dependency build warnings

### models / webapp
- Updated lint disable comments from removed rules (`ban-types` → `no-empty-object-type`, `no-var-requires` → `no-require-imports`)
