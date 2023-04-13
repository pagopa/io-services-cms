# Models for IO-Services-CMS

Define models for all the applications of the system. This is the module that implements schema, validation, and persistence for data.

## Models

### ServiceLifecycle
A finite state machine (FSM) that defines the lifecycle of a Service

```mermaid
stateDiagram-v2
    * --> draft: create
    draft --> draft: edit
    draft --> deleted: delete
    draft --> submitted: submit
    submitted --> draft: abort
    submitted --> approved: approve
    submitted --> rejected: reject
    rejected --> deleted: delete
    rejected --> draft: edit
    approved --> deleted: delete
```

#### Usage
```ts
import { ServiceLifecycle } from "io-services-cms-models";

const MyStore /* define a store to persist data */
const service /* incoming service data */

const applyTask = ServiceLifecycle
    .apply("create", "my-id", { service });

const result = await applyTask(MyStore)();
```
