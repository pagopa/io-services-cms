# io-services-cms-backoffice

## 0.11.0

### Minor Changes

- a9226c4: Added service description preview

## 0.10.0

### Minor Changes

- 9e8b2df: Add Frontend to Api ServicePayload conversion
- e91dae0: Add create service button and empty state on services page

### Patch Changes

- 5a06998: Impements Institution APIs
- 6ede2a8: export getUserResponse apim-data mock

## 0.9.0

### Minor Changes

- 3e818b2: Create the apim user (if it does not exist) with predefined groups (permissions) when exchanging tokens
- 41f8f96: Add service create/update process form

### Patch Changes

- 82da76a: Use Module Pattern on BackOffice B4F as Structurale Design Pattern

## 0.8.0

### Minor Changes

- d0de153: Service details page with alerts, information card and updated context menu
- 3dc2447: Added ServiceLogo component in service details page

### Patch Changes

- 90e009d: Fix auth unit test
- d5c9493: ADD PUT /keys/manage/cidrs API Implementation
- d2a82d4: NextAuth refactoring: use libs following "Module Pattern"

## 0.7.1

### Patch Changes

- 1f01f90: ADD PUT /keys/manage API Implementation
- 7e9f4a0: ADD GET /keys/manage/cidrs API Implementation

## 0.7.0

### Minor Changes

- fe992fd: Add ServiceContextMenu on service details page
- 7c52fee: Add Service Details Page
- e476e0a: Add notifications on fetchData result

### Patch Changes

- 773b243: ADD next-auth authentication API routes
- 3515b33: ADD GET /keys/manage API Implementation

## 0.6.0

### Minor Changes

- 0e9a4ef: Frontend authorization level on Components, Sidenav, Page Routes

### Patch Changes

- a0fc08a: Update NextJs v.13.5 and other minor packages updates

## 0.5.1

### Patch Changes

- 94eec1c: Moving Apim Client in the new External-Clients package

## 0.5.0

### Minor Changes

- f6ce3bc: Add manage key card on Overview, update API Key Page
- 86761c0: BackOffice API Key section

### Patch Changes

- 5a38795: use APP_ENV instead of NODE_ENV to show/hide some test pages

## 0.4.0

### Minor Changes

- 22205bf: Setup B4F and Forward io-services-cms request
- f0e546d: Add Institution selection
- 710a6de: Add AccessControl component and setup unit tests frontend
- b6f7c28: test CD

### Patch Changes

- 593df7a: ADD GET, PUT /keys/manage/cidrs B4F API api route placeholders, and mocks msw
- 221de41: Update next-auth with session token data
- 52db875: ADD /keys/manage and /keys/manage/{keyType} API route handler placeholders

## 0.3.0

### Minor Changes

- 4e91ba8: Add React EmptyState component
- e8a5757: add services-cms rest client
- ca834e9: Added CardDetails and CardShortcut components
- 544cb92: MSW Api mocking library integration
- 28abff9: Added SnackbarProvider component
- f97b81b: Add useFetch react custom hook
- 3cf30ce: Added next-auth frontend authentication
- 9548659: Dynamic Config and MSW Handlers load for Backoffice

### Patch Changes

- c468141: Export Selefcare Identity payload from inline to an external Schemas
- 3b401fd: Refactor PageHeader and target PageBreadcrumbs
- 30eb94c: Fix useTranslation imports
- a603de6: Set target bg-color and sidenav icons

## 0.2.1

### Patch Changes

- 3a4463b: Update to mui-italia@1.0.0, minor packages update

## 0.2.0

### Minor Changes

- 6d18833: Internazionalization (i18n)

### Patch Changes

- 5dd4485: Fix apikeys page route (renamed to keys)
