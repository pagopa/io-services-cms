# IO Services CMS Backoffice

## Local development with MSW

### Prerequisites

- Node.js and Corepack
- dependencies installed from the monorepo root with `pnpm install`

Next.js automatically loads the versioned `.env.development` profile. The
default configuration runs the BFF and uses MSW on the server to mock Selfcare,
APIM, Services CMS, Cosmos DB, and subscription migration.

Create `apps/backoffice/.env.local` with the required feature flags:

```dotenv
FF_SUITABLE_FOR_MINORS_ENABLED=true
NEXT_PUBLIC_FF_SUITABLE_FOR_MINORS_ENABLED=true
```

The server flag exposes suitability in Backoffice responses. The public flag
renders the field in the browser and is fixed when the application is built.
Enable the CMS response flag first, then the Backoffice server flag, and enable
the public flag only after responses include `suitable_for_minors`. Disable the
flags in reverse order.

Run the application from the repository root:

```bash
pnpm install
pnpm --filter io-services-cms-backoffice dev
```

Open [http://localhost:3000](http://localhost:3000). The redirect opens the local
Selfcare page, where you can select an administrator, operator, or aggregator
institution profile.

### MSW server configuration

The main flags in the development profile are:

```dotenv
NEXT_PUBLIC_API_BACKEND_MOCKING=false
API_SERVICES_CMS_MOCKING=true
API_APIM_MOCKING=true
SELFCARE_API_MOCKING=true
COSMOSDB_MOCKING=true
SUBSCRIPTION_MIGRATION_API_MOCKING=true
IS_MSW_ENABLED=true
```

With `NEXT_PUBLIC_API_BACKEND_MOCKING=false`, the BFF APIs run normally and MSW
intercepts their requests to external services.

The local Cosmos handler generates a `draft` lifecycle document for every
service returned by the APIM mock. Publication documents are returned as
missing, so mocked services have no publication visibility.

### Fully mocked frontend

To mock the BFF APIs in the browser as well, add these values to `.env.local`:

```dotenv
NEXT_PUBLIC_API_BACKEND_MOCKING=true
NEXT_PUBLIC_IS_MSW_ENABLED=true
```

Generate the service worker once from the repository root:

```bash
pnpm --filter io-services-cms-backoffice exec msw init public
```

Git ignores `public/mockServiceWorker.js`. In this mode, requests to the
backoffice APIs are handled by `mocks/handlers/backend-handlers.ts`.

Restart the Next.js server after changing any `.env*` file.

### Mock structure

- `mocks/data/backend-data.ts`: Backoffice and Services CMS API responses
- `mocks/data/cosmos-data.ts`: raw documents returned by Cosmos DB
- `mocks/handlers/`: handlers selected by the `*_MOCKING` flags
- `mocks/index.ts`: MSW bootstrap for the browser and server

API mocks expose `suitable_for_minors` directly, while Cosmos lifecycle
documents use `data.age`, matching production data.

## Checks

```bash
pnpm --filter io-services-cms-backoffice test:b4f
pnpm --filter io-services-cms-backoffice test:fe
pnpm --filter io-services-cms-backoffice lint
pnpm --filter io-services-cms-backoffice build
```
