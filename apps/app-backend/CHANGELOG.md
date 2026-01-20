# io-services-app-backend

## 1.2.5

### Patch Changes

- 321dcc37: empty update to rebuild the application
- Updated dependencies [321dcc37]
  - @io-services-cms/models@1.28.4

## 1.2.4

### Patch Changes

- 9673294c: empty update for release rerun
- Updated dependencies [9673294c]
  - @io-services-cms/models@1.28.3

## 1.2.3

### Patch Changes

- 0b0b1871: Moved project to pnpm
- Updated dependencies [0b0b1871]
  - @io-services-cms/models@1.28.2

## 1.2.2

### Patch Changes

- 24b16966: bump version of @azure/identity to v.4.13.0

## 1.2.1

### Patch Changes

- cf1f5bcb: handle STORAGE_ACCOUNT_NAME env var

## 1.2.0

### Minor Changes

- cb23b9b6: add sessionId parameter in API request to the Azure Search index to remove duplicates

## 1.1.6

### Patch Changes

- Updated dependencies [b5e5036c]
  - @io-services-cms/models@1.28.1

## 1.1.5

### Patch Changes

- Updated dependencies [fa35f6f9]
- Updated dependencies [2bf0bddc]
  - @io-services-cms/models@1.28.0

## 1.1.4

### Patch Changes

- Updated dependencies [059e8213]
  - @io-services-cms/models@1.27.2

## 1.1.3

### Patch Changes

- 785df233: Perform a getDocumentCount intead of a full text-search within AI Search check probe

## 1.1.2

### Patch Changes

- 7fcdfcf0: update cms to node 20

## 1.1.1

### Patch Changes

- Updated dependencies [2e7d8bf0]
  - @io-services-cms/models@1.27.1

## 1.1.0

### Minor Changes

- 30efc51d: update openapi definition for getServiceById

### Patch Changes

- 30efc51d: use x-extensible-enum for service category enums

## 1.0.13

### Patch Changes

- Updated dependencies [692d63d8]
  - @io-services-cms/models@1.27.0

## 1.0.12

### Patch Changes

- Updated dependencies [f8ee3f02]
  - @io-services-cms/models@1.26.0

## 1.0.11

### Patch Changes

- Updated dependencies [7cbd2e9a]
  - @io-services-cms/models@1.25.0

## 1.0.10

### Patch Changes

- Updated dependencies [e83ab191]
  - @io-services-cms/models@1.24.0

## 1.0.9

### Patch Changes

- Updated dependencies [d880ab6]
  - @io-services-cms/models@1.23.0

## 1.0.8

### Patch Changes

- Updated dependencies [c0f4f6b]
  - @io-services-cms/models@1.22.0

## 1.0.7

### Patch Changes

- Updated dependencies [d9a513e]
  - @io-services-cms/models@1.21.0

## 1.0.6

### Patch Changes

- Updated dependencies [d13a232]
  - @io-services-cms/models@1.20.1

## 1.0.5

### Patch Changes

- Updated dependencies [f41b5ae]
  - @io-services-cms/models@1.20.0

## 1.0.4

### Patch Changes

- Updated dependencies [9172805]
  - @io-services-cms/models@1.19.6

## 1.0.3

### Patch Changes

- f751acd: Upgrade and align io-ts, fp-ts, ts-commons, io-functions-common dependency across all packages inside the monorepo
- Updated dependencies [f751acd]
  - @io-services-cms/models@1.19.5

## 1.0.2

### Patch Changes

- Updated dependencies [9e2675b]
  - @io-services-cms/models@1.19.4

## 1.0.1

### Patch Changes

- 4cd3347: fix offset limit on search services

## 1.0.0

### Major Changes

- f047e89: Bring Back pre-OTEL applicationsInsight

## 0.0.18

### Patch Changes

- dc84e5e: Fix Application Insight Sampling calculation

## 0.0.17

### Patch Changes

- 7a7fc56: Inject through SDK ApplicationInsight on app backend, this bring to the app all the new OpenTelemetry features

## 0.0.16

### Patch Changes

- 8f36707: fix return count value and decrease max offset value

## 0.0.15

### Patch Changes

- d4e867c: use custom offset limit only when requested a full text search

## 0.0.14

### Patch Changes

- Updated dependencies [e38c96d]
  - @io-services-cms/models@1.19.3

## 0.0.13

### Patch Changes

- 1b7ff70: Increase Default Max Pagination Offset and fix search services pagination validation on app-backend

## 0.0.12

### Patch Changes

- 2b0a54f: Default order on SearchInstitutions on no searchText provided
- d98b3e1: Search Institution Services now will order by service name

## 0.0.11

### Patch Changes

- d8d39a4: Clean App Backend config and old healthchecks

## 0.0.10

### Patch Changes

- 31f5c06: Use Internal Storage Account

## 0.0.9

### Patch Changes

- 40e0b6e: Use New Azure Storage account SDK

## 0.0.8

### Patch Changes

- 9d4af9e: Use new azure storage blob sdk

## 0.0.8

### Patch Changes

- 932df0f: Fix FEATURED_ITEMS_BLOB_CONNECTION_STRING

## 0.0.7

### Patch Changes

- 6d2d0aa: remove useless APPINSIGHTS_INSTRUMENTATIONKEY config reference

## 0.0.6

### Patch Changes

- e49ccb7: Add App Backend HealthChecks

## 0.0.5

### Patch Changes

- afb8aea: Fix Count field on Search Institutions Response
- 2face64: Refactor pagination config

## 0.0.4

### Patch Changes

- 7b60e67: add GetFeaturedServices and GetFeaturedInstitutions api

## 0.0.3

### Patch Changes

- 9d0bc45: Set Specific Azure Search Service Version

## 0.0.2

### Patch Changes

- 65fa1ea: Add GetFeaturedServicesInstitutions Handler
- 5bba659: Add Search Institutions API
- 5a3d6a1: Fix Zip deploy package build
- d71ccd1: add SearchInstitutionServices Azure Function
- 3b2f8ad: Rename project folder from io-services-app-backend to app-backend
- ae2a0a9: ADD Get Service By Id Azure Function
- 407ef0d: Set on PaginationResultSet openApi schema all required fields
- f617c5d: Add organization_name to featured service response
- Updated dependencies [cc8383d]
  - @io-services-cms/models@1.19.2

## 0.0.1

### Patch Changes

- 0495a94: Bootstrap project for io-services-app-backend
