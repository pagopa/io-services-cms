# io-services-app-backend

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
