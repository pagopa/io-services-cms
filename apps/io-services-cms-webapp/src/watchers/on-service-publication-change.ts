import { Queue, ServicePublication } from "@io-services-cms/models";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

type Actions = "requestHistoricization";

type NoAction = typeof noAction;
type Action<A extends Actions, B> = Record<A, B>;
type RequestHistoricizationAction = Action<
  "requestHistoricization",
  Queue.RequestHistoricizationItem
>;
type OnReleaseActions = RequestHistoricizationAction;

const noAction = {};

const onReleaseHandler = ({
  _ts,
  _etag,
  ...otherProps
}: ServicePublication.CosmosResource): RequestHistoricizationAction => ({
  requestHistoricization: {
    ...otherProps,
    // eslint-disable-next-line no-underscore-dangle
    last_update: new Date(_ts * 1000).toISOString() as NonEmptyString, // last_update on service-history record corresponds to the _ts on the service-publication record
    // eslint-disable-next-line no-underscore-dangle
    version: _etag as NonEmptyString, // version on service-history record corresponds to the _etag on the service-publication record
  },
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
