# io-services-cms-models

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
