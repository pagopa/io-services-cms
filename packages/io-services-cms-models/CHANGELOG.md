# io-services-cms-models

## 1.20.1

### Patch Changes

- d13a232: add create subscription managa group handler and business logic

## 1.20.0

### Minor Changes

- f41b5ae: Add new modified_at field to keep track of a service modification date

## 1.19.6

### Patch Changes

- 9172805: replace getInstitutionsUsingGET with getUserInstitutionUsingGET selfcare API

## 1.19.5

### Patch Changes

- f751acd: Upgrade and align io-ts, fp-ts, ts-commons, io-functions-common dependency across all packages inside the monorepo

## 1.19.4

### Patch Changes

- 9e2675b: Fix last_update and version on cosmos containers

## 1.19.3

### Patch Changes

- e38c96d: add privacy_url and contacts automatic controls

## 1.19.2

### Patch Changes

- cc8383d: Create Service Details Read Model

## 1.19.1

### Patch Changes

- 2c575f5: Unify status for serviceHistoryItem component in openApi

## 1.19.0

### Minor Changes

- 62fd6ef: Physically delete a service from service-publication on Service Deletion action

## 1.18.2

### Patch Changes

- 29f62fa: Trim service name before saving in FSM store

## 1.18.1

### Patch Changes

- 2fa088a: create a new release fn intead of the one that uses publication fsm

## 1.18.0

### Minor Changes

- 56a6820: intercept request review handler to perform automatic validation

## 1.17.0

### Minor Changes

- 4329db6: add 'AS' to institution type enum

## 1.16.2

### Patch Changes

- 5ed009b: move topic into service metadata object

## 1.16.1

### Patch Changes

- e5eff28: update vitest to major version on packages projects

## 1.16.0

### Minor Changes

- 86fa737: ADD Service Topics in openapi.yaml

## 1.15.1

### Patch Changes

- e66c6d3: fix autopublish action

## 1.15.0

### Minor Changes

- b6ae125: make publish and unpublish actions idempotent

## 1.14.1

### Patch Changes

- 1ef54a1: change mailAddress to digitalAddress in istitution openapi

## 1.14.0

### Minor Changes

- 7e538e0: ADD ServiceReviewLegacyChecker Azure Function
- c7c186d: Add Request review legacy queue trigger

### Patch Changes

- 880ba56: Check apimUserId instead of serviceId on feature flag for request review legacy

## 1.13.2

### Patch Changes

- 21919a7: unpublish service on delete

## 1.13.1

### Patch Changes

- d80a942: Fix OnRequestSyncCms, update code to process a List of items instead of a single item
- b436659: Change the way how the isVisible field is calculated during CMS to Legacy service Mapping.

## 1.13.0

### Minor Changes

- c5f4f32: Add handler to sync CMS from Legacy

### Patch Changes

- f9eb3db: Add Store CosmosDB Unit Tests

## 1.12.0

### Minor Changes

- 488c6be: CMS to Legacy mapping, LegacyService model update
- 69dedc8: add on service history change handler (except mapping)
- b2cde86: Legacy service watcher

### Patch Changes

- 6f98db8: jira description fix

## 1.11.0

### Minor Changes

- 2959721: Service authorized_cidrs

### Patch Changes

- 2a43386: Fix Store CosmosDB bulk fetch operation

## 1.10.0

### Minor Changes

- c0b772f: ADD category and custom-special_flow parameter on service.metadata
- 9ebf478: add override action to both Lifecycle and Publication FSM
- 559fc1d: Add Legacy Service watcher entry point and its handler
- 08047af: Improve APIs error response codes
- 1c75484: GetServices with bulkFetch

## 1.9.0

### Minor Changes

- e54b0a2: Manage authorized_recipients and sandbox_fiscal_code

## 1.8.0

### Minor Changes

- 488f30a: Renamed FSM Publication Action 'override' in 'release'

## 1.7.0

### Minor Changes

- 646c1f1: ADDED automatic publication capability on submitted to review service

## 1.6.1

### Patch Changes

- 4627c8b: set max amount on publication

## 1.6.0

### Minor Changes

- 5abd2c4: Service Publication Watcher

## 1.5.0

### Minor Changes

- c58013f: Make approved service as publicable

## 1.4.0

### Minor Changes

- b540ebc: add edit service and transaction on fsm

## 1.3.0

### Minor Changes

- b217670: Custom Errors on FSM and updateReview

## 1.2.1

### Patch Changes

- 8d101f4: fix web app config and startup problems

## 1.2.0

### Minor Changes

- 9088413: Add Review Service Controller

## 1.1.0

### Minor Changes

- 89e5bbb: Service Publication FSM
- bade172: add an handler in order to dispatch to proper queue/action each service lifecycle changes

## 1.0.2

### Patch Changes

- 884f845: Implement CreateService operation

## 1.0.1

### Patch Changes

- 76e988b: Fix package configuration and exported types
- fc75ecc: Service review handler

## 1.0.0

### Major Changes

- d9c7a04: First release

### Patch Changes

- 932f4e4: jsut a test commit

## 0.1.0

### Minor Changes

- c9b5570: Added model definition for ServiceLifecycle
