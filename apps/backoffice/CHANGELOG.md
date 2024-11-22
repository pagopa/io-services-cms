# io-services-cms-backoffice

## 1.18.2

### Patch Changes

- e8c50a2f: add missing getManageSubscriptionAuthorizedCidrs and updateManageSubscriptionAuthorizedCidrs handlers

## 1.18.1

### Patch Changes

- b15a28a1: retrieve subscriptions by a kind discriminator parameter
- Updated dependencies [b15a28a1]
  - @io-services-cms/external-clients@1.5.1

## 1.18.0

### Minor Changes

- 82b44297: add getManageSubscriptionKeys route handler
- 185ccffc: add regenerateManageSubscriptionKey route handler

### Patch Changes

- Updated dependencies [82b44297]
- Updated dependencies [185ccffc]
  - @io-services-cms/external-clients@1.5.0

## 1.17.1

### Patch Changes

- 6a350eb7: [BO] filter groups based on the relationship with subscription, in order to return only unbound groups
- Updated dependencies [6a350eb7]
  - @io-services-cms/external-clients@1.4.1

## 1.17.0

### Minor Changes

- e83ab191: allow operator to edit service without overriding group

### Patch Changes

- Updated dependencies [e83ab191]
  - @io-services-cms/models@1.24.0

## 1.16.1

### Patch Changes

- Updated dependencies [d880ab6]
  - @io-services-cms/models@1.23.0

## 1.16.0

### Minor Changes

- c0f4f6b: handle services list visibility based on authzGroups

### Patch Changes

- Updated dependencies [c0f4f6b]
  - @io-services-cms/models@1.22.0
  - @io-services-cms/external-clients@1.4.0

## 1.15.5

### Patch Changes

- a56865a: enable selfcare group-based authz by a feature flag

## 1.15.4

### Patch Changes

- 0fbc0b1: fix manage subscription creation

## 1.15.3

### Patch Changes

- a05f4fe: retrive service list: resolve group name

## 1.15.2

### Patch Changes

- fa890fc: Add authz logic related to service-group relationship

## 1.15.1

### Patch Changes

- 8215bc4: add authorization logic to create service handler

## 1.15.0

### Minor Changes

- d9a513e: manage group_id

### Patch Changes

- Updated dependencies [d9a513e]
  - @io-services-cms/models@1.21.0
  - @io-services-cms/external-clients@1.3.0

## 1.14.0

### Minor Changes

- 2c5ab64: add Retrieve manage group subscriptions API

### Patch Changes

- Updated dependencies [2c5ab64]
  - @io-services-cms/external-clients@1.2.0

## 1.13.1

### Patch Changes

- 40d3a6c: return id instead of full path id
- Updated dependencies [40d3a6c]
  - @io-services-cms/external-clients@1.1.7

## 1.13.0

### Minor Changes

- d13a232: add create subscription managa group handler and business logic

### Patch Changes

- Updated dependencies [d13a232]
  - @io-services-cms/models@1.20.1
  - @io-services-cms/external-clients@1.1.6

## 1.12.1

### Patch Changes

- 7d09349: fix getInstitutionsGroups

## 1.12.0

### Minor Changes

- 56eecc4: add new getInstitutionGroups API

## 1.11.10

### Patch Changes

- 9ee67a8: set default empty cidrs when manage cidrs is not found on cosmos

## 1.11.9

### Patch Changes

- 01c9789: [Renovate] Update @azure/identity to 4.x.x
- Updated dependencies [01c9789]
  - @io-services-cms/external-clients@1.1.5

## 1.11.8

### Patch Changes

- f41b5ae: Add new modified_at field to keep track of a service modification date
- Updated dependencies [f41b5ae]
  - @io-services-cms/models@1.20.0

## 1.11.7

### Patch Changes

- 260da22: set new CMS headers needed for handling Selfcare Groups

## 1.11.6

### Patch Changes

- 5ab8065: filter only ACTIVE user's institutions retrieved from selfcare API

## 1.11.5

### Patch Changes

- c9dc730: Tests for MarkdownView component
- 3d79a49: Tests for Notification component

## 1.11.4

### Patch Changes

- 9172805: replace getInstitutionsUsingGET with getUserInstitutionUsingGET selfcare API
- Updated dependencies [9172805]
  - @io-services-cms/models@1.19.6

## 1.11.3

### Patch Changes

- f751acd: Upgrade and align io-ts, fp-ts, ts-commons, io-functions-common dependency across all packages inside the monorepo
- 83b55d2: Tests for Loader components
- 63f0d65: Create/Edit service: update sensitive service documentation link
- Updated dependencies [f751acd]
  - @io-services-cms/models@1.19.5
  - @io-services-cms/external-clients@1.1.4

## 1.11.2

### Patch Changes

- 70078ff: Tests for Header component
- 8d4d9da: Footer tests

## 1.11.1

### Patch Changes

- 0557c4c: Fix MobileTypography component interface

## 1.11.0

### Minor Changes

- d513734: New feature: service in App preview

### Patch Changes

- 0fe8ffc: Made tests for DialogProvider component
- 9996b8b: Tests for Drawer Provider
- e7d0ac3: Fix backoffice drawer unit tests

## 1.10.11

### Patch Changes

- 34a6583: Fixed lint error for jest method
- a361970: Tests for button components
- Updated dependencies [9e2675b]
  - @io-services-cms/models@1.19.4

## 1.10.10

### Patch Changes

- d3b322c: Update copy in service create/update step 3 description and Authorized CIDRs descripion in both ApiKeys and ServiceDetails pages

## 1.10.9

### Patch Changes

- 550a571: Made the ip/cidr inputs unclickable outside the edit mode

## 1.10.8

### Patch Changes

- 7a7fc56: Inject through SDK ApplicationInsight on app backend, this bring to the app all the new OpenTelemetry features

## 1.10.7

### Patch Changes

- 3dc229d: Upgrade ApplicationInsight to the one based on OpenTelemetry
- Updated dependencies [e38c96d]
  - @io-services-cms/models@1.19.3

## 1.10.6

### Patch Changes

- 383fc39: Fix ServiceHistory unwanted continuationToken on first call

## 1.10.5

### Patch Changes

- 1403107: Fix Apim Error io-ts decoder
- Updated dependencies [1403107]
  - @io-services-cms/external-clients@1.1.3

## 1.10.4

### Patch Changes

- f8ac915: Better Apim Error Logs
- Updated dependencies [f8ac915]
  - @io-services-cms/external-clients@1.1.2

## 1.10.3

### Patch Changes

- 4052dea: Developed the phon frame for the preview

## 1.10.2

### Patch Changes

- 99e8de6: Created the skeleton and the logic for the In APP Preview

## 1.10.1

### Patch Changes

- 407ef0d: Set on PaginationResultSet openApi schema all required fields
- e115c5c: Added a enviroment variable to manage the login path redirect
- Updated dependencies [cc8383d]
  - @io-services-cms/models@1.19.2

## 1.10.0

### Minor Changes

- da23e9f: Topic is now required on Service Creation/Edit

## 1.9.4

### Patch Changes

- 7b0a029: Service history drawer: update status type management

## 1.9.3

### Patch Changes

- 1801d69: Unify History payload status field
- Updated dependencies [2c575f5]
  - @io-services-cms/models@1.19.1

## 1.9.2

### Patch Changes

- d345cfb: update jose library
- Updated dependencies [62fd6ef]
  - @io-services-cms/models@1.19.0

## 1.9.1

### Patch Changes

- Updated dependencies [29f62fa]
  - @io-services-cms/models@1.18.2

## 1.9.0

### Minor Changes

- 2ce0edc: Zendesk webform integration (frontend only implementation)

## 1.8.0

### Minor Changes

- 00b0ba5: Add service history feature in service details page

## 1.7.1

### Patch Changes

- 1339f4e: replace X-Frame-Options with Content-Security-Policy header

## 1.7.0

### Minor Changes

- 6703c1f: Add GetServiceHistory Route Handler in Backoffice

## 1.6.9

### Patch Changes

- 454b2c6: Fix url fields in service create/update form: blanks at the beginning or end of the value are not allowed and the field display error correctly
- 49ba925: Add GetServiceHistory into BackOffice backend api specification

## 1.6.8

### Patch Changes

- Updated dependencies [2fa088a]
  - @io-services-cms/models@1.18.1

## 1.6.7

### Patch Changes

- 75f5da1: Force logo CDN refresh

## 1.6.6

### Patch Changes

- Updated dependencies [56a6820]
  - @io-services-cms/models@1.18.0

## 1.6.5

### Patch Changes

- e4ed672: add x-frame-option header
- 14dc5a8: Sanitize Route Handlers response objects
- a618c6f: Fix inconsistent data in PageBreadcrumbs calling the app url with certain characters as query parameters
- 0352dac: Decrease session max idle duration on backoffice

## 1.6.4

### Patch Changes

- 95da718: Add custom error page for next-auth errors
- a8bef49: replace React cache with singleton

## 1.6.3

### Patch Changes

- 9eb5d28: Retrieve topics on Backoffice

## 1.6.2

### Patch Changes

- 842f1d7: Fix frontend xss vulnerability on ServiceVersionSwitcher component

## 1.6.1

### Patch Changes

- 211c3b8: Disable assistance button

## 1.6.0

### Minor Changes

- 3260f2d: Zendesk frontend integration
- 1ec0295: add selfcare/zendesk integration

### Patch Changes

- 4ac95c9: Service details: update text color and fix logo card height
- e7ff310: ApiKeyValue: fix gray background color which is now only present under the key value and the copy to clipboard button
- Updated dependencies [4329db6]
  - @io-services-cms/models@1.17.0

## 1.5.7

### Patch Changes

- f9e3100: Update ServiceVersionSwitcher component layout
- a2c2418: Services TableRowMenu: add icons and set delete action as last
- 495a49a: Update ux/ui on TextFieldArrayController (used in auth cidrs input)
- f1ff588: Fix responsive layout on migration overview
- b0f9a38: Customize MUI Chip theme colors

## 1.5.6

### Patch Changes

- b6ca2a3: Page Header: Replace breadcrumbs with exit shortcut on service create/update pages
- 4019e32: Update service-context-menu actions: update publish/unpublish icons and button variant, fix edit action color

## 1.5.5

### Patch Changes

- e2c71a8: Change sidenav bottom menu icon for opening/collapsing sidenav
- 10a0d75: Fix language selector: detect browser language and, in case of supported one, show it correctly on footer language selector
- 6c76f01: Services import button: add icon and increase font-weight
- f76b546: Update card tertiary CTA layout
- bc20e40: Update service create/update form icons
- 0e1fff0: Reduce visibility icons size in services page

## 1.5.4

### Patch Changes

- 89d6e10: Update deleted service table row layout in Services Page

## 1.5.3

### Patch Changes

- f3d966c: Rename "Chiavi API" to "API Key" in IT translations
- 9e9a11b: Upgrade Axios and follow-redirects dependencies
- acb4a9f: flip apim user firstName and note values

## 1.5.2

### Patch Changes

- 85d2fec: Fix upload service logo copy

## 1.5.1

### Patch Changes

- ea9b420: fix topic id null check

## 1.5.0

### Minor Changes

- 42c38d0: Add frontend topic management on service create/update

## 1.4.6

### Patch Changes

- b8b34b3: Add topics on sevices-cms-handlers msw mock
- b1e6dec: ADD topic Enrichment on Service List Route Handler
- 76b20a7: Add Retrieve Service topics Route Handler in Backoffice B4F

## 1.4.5

### Patch Changes

- 1112624: fix topic metadata on frontend adapter
- e22188e: Update MSW library to major v2 release
- Updated dependencies [5ed009b]
  - @io-services-cms/models@1.16.2

## 1.4.4

### Patch Changes

- Updated dependencies [e5eff28]
  - @io-services-cms/models@1.16.1
  - @io-services-cms/external-clients@1.1.1

## 1.4.3

### Patch Changes

- 8584589: update vite/vitest to major version

## 1.4.2

### Patch Changes

- dc72c8b: Update nextJS to 13.5.6

## 1.4.1

### Patch Changes

- 528bbf3: add request ip logs

## 1.4.0

### Minor Changes

- 0554dc1: Added topic information in service details page

### Patch Changes

- 3321adb: Add X-Forwaded-For header on io-services-cms REST API call from B4F

## 1.3.0

### Minor Changes

- 4e32029: ADD Service Topics in backoffice openapi.yaml

### Patch Changes

- 7e147dc: Update B4F openapi definition: replace bearerAuth with cookieAuth
- Updated dependencies [86fa737]
  - @io-services-cms/models@1.16.0

## 1.2.3

### Patch Changes

- 610b086: UPDATE User Authorized institution API response type
- e350173: reintroduced GET /api/institutions API, which returns all the user's authorized institutions
- 44d7988: Frontend header: get user authorized institutions from api instead of session token
- cbded9f: remove uthorized institutions from session token
- aad15fe: truncate organization name to 100 characters before set apim user lastName fields during apim user creation

## 1.2.2

### Patch Changes

- Updated dependencies [e66c6d3]
  - @io-services-cms/models@1.15.1

## 1.2.1

### Patch Changes

- Updated dependencies [b6ae125]
  - @io-services-cms/models@1.15.0

## 1.2.0

### Minor Changes

- cecb2e9: Added product switch on header

## 1.1.1

### Patch Changes

- e9dca06: apim rest error shrink log

## 1.1.0

### Minor Changes

- 6b3c6f7: Enable institution selection (party switch)

### Patch Changes

- 8ad86f2: decrease session duration to 12 hours
- ca612ae: Detailed logs on auth Route Handler

## 1.0.0

### Major Changes

- 18dba64: Backoffice MVP0 public major version

### Patch Changes

- ac29609: Temporary remove institution selection on page header

## 0.17.14

### Patch Changes

- 18f38e7: Fix frontend service rejection reason drawer

## 0.17.13

### Patch Changes

- 93ad5de: CleanUp BackOffice

## 0.17.12

### Patch Changes

- 6c4c3cb: Fix service name left alignment on services table, await create/update service completion before going to services page, add table pagination translated labels
- dd7c11c: fix-istitution-open-api-part-2
- Updated dependencies [1ef54a1]
  - @io-services-cms/models@1.14.1

## 0.17.11

### Patch Changes

- c821f9a: fix services logo url configuration

## 0.17.10

### Patch Changes

- d5b29f0: log unknown error

## 0.17.9

### Patch Changes

- 6d0c2e9: initialize manage cidrs when creating subscription manage
- 84a70d7: fix selfcare JWT configuration
- 206e3a5: filter manage subscription on service list
- ae688e5: Hide service history action button and add scope in service info drawer

## 0.17.8

### Patch Changes

- 650d0d6: Fix layout main content overflow break
- 31116e8: ADD missing service placeholder on service list Route Handler result's
- 5524506: fix payload create subscription manage

## 0.17.7

### Patch Changes

- 03fada0: add ApiServiceWrite permission to user (if missing)
- aeaf8e1: adapt ownership claim response

## 0.17.6

### Patch Changes

- 1096a77: Change MigrationData schema on frontend

## 0.17.5

### Patch Changes

- 5828b71: UX/UI refinements for the MVP0 release
- d9da47f: Update service details drawer
- 864c1b9: change response schema MigrationData

## 0.17.4

### Patch Changes

- d3c1ae6: fix JWKS config

## 0.17.3

### Patch Changes

- 15d3892: fix configurations

## 0.17.2

### Patch Changes

- e793695: handle io-services-cms error response

## 0.17.1

### Patch Changes

- 804a8ff: Disabled MSW

## 0.17.0

### Minor Changes

- f41aeb3: Add frontend subscriptions migration components and section logic

### Patch Changes

- 6c7cbe1: add time debug log on regenerate manage key

## 0.16.2

### Patch Changes

- de7a814: temporany log to trace millis spent in external calls and general api completion

## 0.16.1

### Patch Changes

- 9540e6f: Transform external clients into regular singleton instead of caching instance using react cache

## 0.16.0

### Minor Changes

- 0d5c76d: Integrate Application Insights

### Patch Changes

- 2c34239: removed healtcheck which calls external services

## 0.15.5

### Patch Changes

- e1acb56: remove getIoServicesCmsHealth on info api

## 0.15.4

### Patch Changes

- 0e99e42: ADD agentkeepalive on backoffice B4F rest client

## 0.15.3

### Patch Changes

- 0f56282: ock services-cms /info only in development environment

## 0.15.2

### Patch Changes

- 83059a6: Handle 404 Apim getServiceList response

## 0.15.1

### Patch Changes

- 7416536: Fix subscription migration config

## 0.15.0

### Minor Changes

- 45c0aed: ADD API Subscriptions Migrations

## 0.14.0

### Minor Changes

- 36a558e: Add search by serviceId on services page

### Patch Changes

- adb0a0d: ADD queryParam 'id' in GET /services/list Route Handler
- d814296: fix staging health check

## 0.13.2

### Patch Changes

- 779cfb8: fix deploy staging healthcheck url

## 0.13.1

### Patch Changes

- f10afb3: add missing configurations

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
