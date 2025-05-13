import { DateUtils, Queue, ServicePublication } from "@io-services-cms/models";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

type Actions = "requestDetailPublication";

type NoAction = typeof noAction;
type Action<A extends Actions, B> = Record<A, B>;
type RequestDetailPublicationAction = Action<
  "requestDetailPublication",
  Queue.RequestDetailItem
>;
type OnDetailPublicationActions = RequestDetailPublicationAction;

const noAction = {};

const onDetailPublicationHandler = ({
  _ts,
  modified_at,
  ...item
}: ServicePublication.CosmosResource): RequestDetailPublicationAction => ({
  requestDetailPublication: {
    ...item,
    // eslint-disable-next-line no-underscore-dangle
    cms_last_update_ts: modified_at ?? DateUtils.unixSecondsToMillis(_ts),
    kind: "publication",
  },
});

export const handler: RTE.ReaderTaskEither<
  { item: ServicePublication.CosmosResource },
  Error,
  NoAction | OnDetailPublicationActions
> = ({ item }) => pipe(item, onDetailPublicationHandler, TE.right);
