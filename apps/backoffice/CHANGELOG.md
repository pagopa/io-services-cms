# io-services-cms-backoffice

## 0.13.0

### Minor Changes

- 1bd296f: Added institution card and create service shortcut on overview page

### Patch Changes

- f3fd4fa: ADD Azure Access Token Refresh capabilities on token expiration
- acc0500: fix configurations

## 0.12.1

### Patch Changes

- fb5cbd6: bugfix: handle request body not present from create and update service request handler
- 5247ad8: bugfix: fix request body read
- ab001a2: Remove organization data from frontend service payload
- 902bc18: Add equality check on update service form: avoid to send update and notify user if initial form values are equal to submitted values

## 0.12.0

### Minor Changes

- 58a205a: refactor: move apim service to external-clients package
- 600702d: Make the setting of organization fields transparent to the user when creating and updating the service.
- 3275674: Add Services Page with TableView and ServiceVersionSwitcher components
- f642e3a: retrieve user authorized institutions from selfcare
- 37b5b16: add logged institution logo to session token
- a2cb7c2: retrieve or create (if not exists) manage subscription during token exchange process
- b4c9993: ADD GET /services/list API endpoint
- 1bc220a: Added frontend update service, added redirection feature on useFetch

### Patch Changes

- fcb4a8a: Added privacy, tos and personal data protection URLs on footer
- 76a7fa6: Health and Info API Route Segment Dynamic Configuration
- fd23925: ADD GET /health API in Backoffice B4F
- 623ec28: ADD HealthChecks to backoffice B4F
- Updated dependencies [58a205a]
  - @io-services-cms/external-clients@1.1.0

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
