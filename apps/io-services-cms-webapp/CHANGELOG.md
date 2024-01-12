# io-services-cms-webapp

## 1.26.4

### Patch Changes

- d2a5303: ADD GET /internal/services/:serviceId and GET /internal/services/:serviceId/release API

## 1.26.3

### Patch Changes

- 0d0a06e: ADD PostgresSQL DB healthcheck

## 1.26.2

### Patch Changes

- 29893cd: Allow Sync to legacy only for Publication an Delete Service History Items
- 982be43: Replace findOneByServiceId with findLastVersionByModelId in request-sync-legacy-handler

## 1.26.1

### Patch Changes

- d390dc8: Deploy API GET /services/topics

## 1.26.0

### Minor Changes

- a93c05c: ADD GET /services/topics API implementation

### Patch Changes

- 85a2109: TEST APIM cache policy

## 1.25.3

### Patch Changes

- 5c269fb: remove category and custom_special_flow to api response

## 1.25.2

### Patch Changes

- ea9b420: fix topic id null check

## 1.25.1

### Patch Changes

- c2ac0ea: fix query get topic

## 1.25.0

### Minor Changes

- 8415fb4: manage new service topic fields

## 1.24.6

### Patch Changes

- 4b1e07a: ADD ServiceBaseMetadata and ServicePayloadMetadata missing on webapp openapi.yaml
- 7c2d4a3: Edit jira issue scope layout
- Updated dependencies [5ed009b]
  - @io-services-cms/models@1.16.2

## 1.24.5

### Patch Changes

- Updated dependencies [e5eff28]
  - @io-services-cms/models@1.16.1
  - @io-services-cms/external-clients@1.1.1

## 1.24.4

### Patch Changes

- 8584589: update vite/vitest to major version

## 1.24.3

### Patch Changes

- 6324265: add express trust proxy config"

## 1.24.2

### Patch Changes

- 528bbf3: add request ip logs
- 4d9cf3c: Include Backoffice Subnet CIDRs

## 1.24.1

### Patch Changes

- ee62761: Add log temporary log on AzureUserAttributesManageMiddlewareWrapper

## 1.24.0

### Minor Changes

- 806ade4: Avoid Checking Authorized CIDRs in B4F Request forwarded to CMS

### Patch Changes

- 6a65cc6: add max_allowed_payment_amount field in api response
- 0f56eab: reduce default logging level
- 3321adb: Add X-Forwaded-For header on io-services-cms REST API call from B4F

## 1.23.0

### Minor Changes

- 86fa737: ADD Service Topics in openapi.yaml
- 73bad07: reopen jira reject issue on a new submit

### Patch Changes

- b15ad8f: add require_secure_channel and authorized_recipients in api response
- Updated dependencies [86fa737]
  - @io-services-cms/models@1.16.0

## 1.22.1

### Patch Changes

- e66c6d3: fix autopublish action
- Updated dependencies [e66c6d3]
  - @io-services-cms/models@1.15.1

## 1.22.0

### Minor Changes

- b6ae125: make publish and unpublish actions idempotent

### Patch Changes

- a102d23: Add workaround to handle DELETED as service name on OnLegacyServiceChange AZF
- Updated dependencies [b6ae125]
  - @io-services-cms/models@1.15.0

## 1.21.10

### Patch Changes

- Updated dependencies [1ef54a1]
  - @io-services-cms/models@1.14.1

## 1.21.9

### Patch Changes

- 1c080eb: Change response statusCode on createService API

## 1.21.8

### Patch Changes

- 2567058: change contract field on jira ticket creation

## 1.21.7

### Patch Changes

- 388e98d: Fix response on Publish Service for non approved service
- Updated dependencies [58a205a]
  - @io-services-cms/external-clients@1.1.0

## 1.21.6

### Patch Changes

- e103bd1: Remove Upload Service Logo Test API

## 1.21.5

### Patch Changes

- 808f038: ADD test logo api

## 1.21.4

### Patch Changes

- ed50a11: ADD Upload service logo API

## 1.21.3

### Patch Changes

- 5a35773: Upgrade github action runner image version

## 1.21.2

### Patch Changes

- 9227198: Handle new jira issue status names

## 1.21.1

### Patch Changes

- d5500a0: bugfix delete never approved service

## 1.21.0

### Minor Changes

- 94eec1c: Moving Apim Client in the new External-Clients package

### Patch Changes

- 1572c54: Update openapi-codegen-ts to version ^13.1.0 in io-services-cms-webapp
- Updated dependencies [94eec1c]
  - @io-services-cms/external-clients@1.0.0

## 1.20.9

### Patch Changes

- 9dfd38e: Fix Azure Deploy action

## 1.20.8

### Patch Changes

- e47f151: Handle Jira Issue status name case change

## 1.20.7

### Patch Changes

- 9707eb9: update jira issue description
- e5914bc: Add Automatic Service Approval Capability in RequestReviewHandler
- 1a0cc5b: Logging unification and improvements

## 1.20.6

### Patch Changes

- 8c5a81b: Add a placeholder value before syncing a service to legacy one that lacks the field "department name"

## 1.20.5

### Patch Changes

- 0db9c2e: Set startFromBeginning on ServiceHistoryWatcher

## 1.20.4

### Patch Changes

- 53f2b12: Skip currently deleted services on OnRequestReviewLegacy and RequestReviewLegacyChecker

## 1.20.3

### Patch Changes

- bf51f9c: Fetch previous legacy service recursive

## 1.20.2

### Patch Changes

- a23d4dd: Updated Github Actions

## 1.20.1

### Patch Changes

- 3ff1976: Add statuscategorychangedate default value on JiraIssue io-ts type

## 1.20.0

### Minor Changes

- 7e538e0: ADD ServiceReviewLegacyChecker Azure Function
- c7c186d: Add Request review legacy queue trigger

### Patch Changes

- ffd7577: Added a feature flag to restrict Jira Legacy sync only for service belonging to selected users
- 48a699f: add legacy ticket status to jira client
- 84317cf: Removed Jira call and update status mapping on LegacyServiceWatcher
- 880ba56: Check apimUserId instead of serviceId on feature flag for request review legacy
- Updated dependencies [7e538e0]
- Updated dependencies [c7c186d]
- Updated dependencies [880ba56]
  - @io-services-cms/models@1.14.0

## 1.19.29

### Patch Changes

- 1a115bf: statuscategorychangedate optional in JiraLegacyIssue

## 1.19.28

### Patch Changes

- b4feca7: Add retry capabilities to Jira Legacy Client on Throttled response

## 1.19.27

### Patch Changes

- 0aa8439: Optimization Jira REST Api call on Legacy Service Watcher

## 1.19.26

### Patch Changes

- 2aeb4bd: Add retry on Legacy Service Watcher

## 1.19.25

### Patch Changes

- 8193fcc: Legacy Service Watcher set sequential process mode

## 1.19.24

### Patch Changes

- ff01bca: Add fixed value for maxItemsPerInvocation on LegacyServiceWatcher

## 1.19.23

### Patch Changes

- 8a550f3: Fix type legacy service watcher max items per invocation

## 1.19.22

### Patch Changes

- 529b734: Fix type legacy service watcher max items per invocation

## 1.19.21

### Patch Changes

- 28b6c98: Add Max Items per Invocations on LegacyServiceWatcher

## 1.19.20

### Patch Changes

- 5505553: Log not json response received from jira

## 1.19.19

### Patch Changes

- 388cd81: update runner image

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
