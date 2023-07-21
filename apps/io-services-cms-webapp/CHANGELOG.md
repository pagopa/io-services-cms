# io-services-cms-webapp

## 1.19.18

### Patch Changes

- d18748c: Updated jira-legacy-client.ts error handling

## 1.19.17

### Patch Changes

- 6df95c5: Feature Flag Optimization

## 1.19.16

### Patch Changes

- 2c104b8: Add status on checkJiraResponse when an unknown status is received

## 1.19.15

### Patch Changes

- 8ecfaec: preparation for controlled massive sync
- 9958603: Wrap error adding information about the processed serviceId

## 1.19.14

### Patch Changes

- 32f56a8: unpublish service when deleting request is coming from legacy sync

## 1.19.13

### Patch Changes

- 02a4a4b: Map Completata status.name for Jira Legacy Status name
- 21919a7: unpublish service on delete
- Updated dependencies [21919a7]
  - @io-services-cms/models@1.13.2

## 1.19.12

### Patch Changes

- 329ae0a: Map legacy not visible service to unpublished CMS service

## 1.19.11

### Patch Changes

- cb319d4: Add placeholder value for metadata.description while mapping a legacy sevice who lacks of description

## 1.19.10

### Patch Changes

- 6454a43: Generator doesn't generate correctly required parameter inside allOf in openApi
- 5dd4cfa: Add placeholder value when a legacy service lack of description

## 1.19.9

### Patch Changes

- 3b5f19d: Add DELETED suffix on serviceName while mapping, cms -> legacy, a deleted service
- 4a87596: Code CleanUp Request Sync CMS

## 1.19.8

### Patch Changes

- d80a942: Fix OnRequestSyncCms, update code to process a List of items instead of a single item
- b436659: Change the way how the isVisible field is calculated during CMS to Legacy service Mapping.
- Updated dependencies [d80a942]
- Updated dependencies [b436659]
  - @io-services-cms/models@1.13.1

## 1.19.7

### Patch Changes

- e3b8afb: Fix JQL query on searchJiraIssueByServiceId for jira-legacy-client.ts

## 1.19.6

### Patch Changes

- a9a1029: Fix cmsTag handling on LegacyServiceWatcher in order to avoid sync loop

## 1.19.5

### Patch Changes

- e38b86c: Legacy Service Watcher startFromBeginning set to false
- 8da02ee: Add UserId inclusionList FeatureFlag on Legacy to CMS sync

## 1.19.4

### Patch Changes

- 852ff1f: Fix Wrong Class method reference in pipe

## 1.19.3

### Patch Changes

- 318e64f: Fix Stringify

## 1.19.2

### Patch Changes

- 8d8562b: Add Verbose log on Request Sync Legacy Handler

## 1.19.1

### Patch Changes

- 59da654: Fix Service History Feature Flag

## 1.19.0

### Minor Changes

- c2fbce2: startFromBeginning set to false on ServiceHistory

## 1.18.0

### Minor Changes

- 1a7e48a: Add handler to manage legacy sync requests
- 378a047: Add Logger and TelemetryClient
- c5f4f32: Add handler to sync CMS from Legacy
- b4bbd7c: Add FeatureFlag for cms to legacy sync

### Patch Changes

- 9e59e73: refactor: move from Legacy label into a shared utility
- Updated dependencies [f9eb3db]
- Updated dependencies [c5f4f32]
  - @io-services-cms/models@1.13.0

## 1.17.2

### Patch Changes

- 7e373b1: Change extensionBundle version

## 1.17.1

### Patch Changes

- 68b835e: Add extensionBundle in host.json

## 1.17.0

### Minor Changes

- 488c6be: CMS to Legacy mapping, LegacyService model update
- 69dedc8: add on service history change handler (except mapping)
- b2cde86: Legacy service watcher

### Patch Changes

- 4a692f1: Fix Get Service Keys API
- 6f98db8: jira description fix
- 9793553: add legacy filter on service lifecycle watcher to avoid sync loop
- Updated dependencies [488c6be]
- Updated dependencies [69dedc8]
- Updated dependencies [b2cde86]
- Updated dependencies [6f98db8]
  - @io-services-cms/models@1.12.0

## 1.16.0

### Minor Changes

- 2959721: Service authorized_cidrs

### Patch Changes

- e70a018: add request historicization action to on-service-lifecycle-change handler
- Updated dependencies [2959721]
- Updated dependencies [2a43386]
  - @io-services-cms/models@1.11.0

## 1.15.0

### Minor Changes

- c0b772f: ADD category and custom-special_flow parameter on service.metadata
- 03c7925: Add Manage Key Middleware in Controllers, check caller user request serviceId ownership
- 559fc1d: Add Legacy Service watcher entry point and its handler
- 3b8143f: check source ip
- 08047af: Improve APIs error response codes
- 23a35fa: Fix OwnerId match issue on serviceOwnerCheckManageTask
- bbd4ae8: API Regenerate service keys
- 1c75484: GetServices with bulkFetch
- 319af84: API Get service keys

### Patch Changes

- 15446e3: Rename on-service-lifecycle-change watcher file
- 7a74235: Update ServiceReviewChecker cron expression
- Updated dependencies [c0b772f]
- Updated dependencies [9ebf478]
- Updated dependencies [559fc1d]
- Updated dependencies [08047af]
- Updated dependencies [1c75484]
  - @io-services-cms/models@1.10.0

## 1.14.0

### Minor Changes

- e54b0a2: Manage authorized_recipients and sandbox_fiscal_code

### Patch Changes

- Updated dependencies [e54b0a2]
  - @io-services-cms/models@1.9.0

## 1.13.4

### Patch Changes

- d0db5bc: restore deploy action

## 1.13.3

### Patch Changes

- 0cc1c12: fix

## 1.13.2

### Patch Changes

- 6a2eae6: fix release action
- ae61a44: fix

## 1.13.1

### Patch Changes

- d5ae687: fix cd pipeline

## 1.13.0

### Minor Changes

- 488f30a: Renamed FSM Publication Action 'override' in 'release'

### Patch Changes

- Updated dependencies [488f30a]
  - @io-services-cms/models@1.8.0

## 1.12.0

### Minor Changes

- 646c1f1: ADDED automatic publication capability on submitted to review service

### Patch Changes

- Updated dependencies [646c1f1]
  - @io-services-cms/models@1.7.0

## 1.11.1

### Patch Changes

- f4a44d1: Test CD pipeline
- bc96b10: Test deploy action

## 1.11.0

### Minor Changes

- 4627c8b: set max amount on publication

### Patch Changes

- Updated dependencies [4627c8b]
  - @io-services-cms/models@1.6.1

## 1.10.1

### Patch Changes

- 4940ccb: test deploy app

## 1.10.0

### Minor Changes

- 5abd2c4: Service Publication Watcher

### Patch Changes

- Updated dependencies [5abd2c4]
  - @io-services-cms/models@1.6.0

## 1.9.1

### Patch Changes

- 04f4dca: Refactor Review Checker Handler in order to improve performance
- 18bea6a: Moved controllers tests from general file under src/webservice/**test**/index.test.ts -> specific src/webservice/controllers/**test**/<controller>.test.ts
- fe0b37b: fix update service serview and add error management on service-review-checker

## 1.9.0

### Minor Changes

- c58013f: Make approved service as publicable

### Patch Changes

- Updated dependencies [c58013f]
  - @io-services-cms/models@1.5.0

## 1.8.0

### Minor Changes

- b540ebc: add edit service and transaction on fsm
- fbbd8c8: ADD Get Service Lifecycle API

### Patch Changes

- Updated dependencies [b540ebc]
  - @io-services-cms/models@1.4.0

## 1.7.0

### Minor Changes

- b217670: Custom Errors on FSM and updateReview

### Patch Changes

- Updated dependencies [b217670]
  - @io-services-cms/models@1.3.0

## 1.6.0

### Minor Changes

- 08ada79: ADD Get service publication API
- 0d50104: Add Unpublish Service API
- e598011: OpenAPI Service status update
- ed1bbdb: Publish Service API

## 1.5.3

### Patch Changes

- a038797: Update package.json: replace node-fetch with node-fetch-commonjs
- 8d101f4: fix web app config and startup problems
- Updated dependencies [8d101f4]
  - @io-services-cms/models@1.2.1

## 1.5.2

### Patch Changes

- 950d715: Fix healthcheck

## 1.5.1

### Patch Changes

- fc06a0c: Fix broken configuration
- 8d1169d: Fix broken entrypoint
- 20dbb3b: Fix broken configuration

## 1.5.0

### Minor Changes

- 9088413: Add Review Service Controller
- 6d7940f: Add watcher on ServiceLifecycle updates to handle service submission and dispatch review jobs

### Patch Changes

- Updated dependencies [9088413]
  - @io-services-cms/models@1.2.0

## 1.4.0

### Minor Changes

- bade172: add an handler in order to dispatch to proper queue/action each service lifecycle changes

### Patch Changes

- Updated dependencies [89e5bbb]
- Updated dependencies [bade172]
  - @io-services-cms/models@1.1.0

## 1.3.0

### Minor Changes

- 43727f2: add timerTrigger fn and its entryPoint to poll PendingReview data from Postgres and Jira
- 9534d3b: Service review checker handler

## 1.2.0

### Minor Changes

- 884f845: Implement CreateService operation

### Patch Changes

- Updated dependencies [884f845]
  - @io-services-cms/models@1.0.2

## 1.1.0

### Minor Changes

- 552ab4f: Add DB migration for PostgreSQL
- fc75ecc: Service review handler

### Patch Changes

- 214be58: use exModuleInterop for typescript module resolution
- Updated dependencies [76e988b]
- Updated dependencies [fc75ecc]
  - @io-services-cms/models@1.0.1

## 1.0.2

### Patch Changes

- 162ef57: Fix package script

## 1.0.1

### Patch Changes

- d9c7a04: First release
- Updated dependencies [d9c7a04]
- Updated dependencies [932f4e4]
  - @io-services-cms/models@1.0.0

## 1.0.0

### Major Changes

- 0dff02c: Web application first release

### Patch Changes

- Updated dependencies [c9b5570]
  - io-services-cms-models@0.1.0
