import { DateUtils, Queue, ServiceLifecycle } from "@io-services-cms/models";
import * as B from "fp-ts/boolean";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

type Actions = "requestDetailLifecycle";

type NoAction = typeof noAction;
type Action<A extends Actions, B> = Record<A, B>;
type RequestDetailLifecycleAction = Action<
  "requestDetailLifecycle",
  Queue.RequestDetailItem
>;
type OnDetailLifecycleActions = RequestDetailLifecycleAction;

const noAction = {};

const onDetailLifecycleHandler = ({
  _ts,
  data: {
    metadata: { group_id: _, ...metadata },
    ...data
  },
  modified_at,
  ...item
}: ServiceLifecycle.CosmosResource): RequestDetailLifecycleAction => ({
  requestDetailLifecycle: {
    ...item,
    cms_last_update_ts: modified_at ?? DateUtils.unixSecondsToMillis(_ts),
    data: { metadata: { ...metadata }, ...data },
    kind: "lifecycle",
  },
});

export const handler: RTE.ReaderTaskEither<
  { item: ServiceLifecycle.CosmosResource },
  Error,
  NoAction | OnDetailLifecycleActions
> = ({ item }) =>
  pipe(
    item.fsm.state === "draft",
    B.fold(
      () => noAction,
      () => pipe(item, onDetailLifecycleHandler),
    ),
    TE.right,
  );
