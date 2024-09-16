import { Queue, ServicePublication } from "@io-services-cms/models";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { buildRequestHistoricizationQueueMessage } from "../historicizer/request-historicization-handler";

type Actions = "requestHistoricization";

type NoAction = typeof noAction;
type Action<A extends Actions, B> = Record<A, B>;
type RequestHistoricizationAction = Action<
  "requestHistoricization",
  Queue.RequestHistoricizationItem
>;
type OnReleaseActions = RequestHistoricizationAction;

const noAction = {};

const onReleaseHandler = (
  item: ServicePublication.CosmosResource,
): RequestHistoricizationAction => ({
  requestHistoricization: buildRequestHistoricizationQueueMessage(item),
});

export const handler: RTE.ReaderTaskEither<
  { item: ServicePublication.CosmosResource },
  Error,
  NoAction | OnReleaseActions
> = ({ item }) => {
  switch (item.fsm.state) {
    case "unpublished":
    case "published":
      return pipe(item, onReleaseHandler, TE.right);
    default:
      return TE.right(noAction);
  }
};
