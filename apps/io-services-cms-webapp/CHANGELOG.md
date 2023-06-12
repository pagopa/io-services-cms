# io-services-cms-webapp

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
