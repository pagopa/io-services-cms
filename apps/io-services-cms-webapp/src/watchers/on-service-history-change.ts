import { Queue, ServiceHistory } from "@io-services-cms/models";
import * as E from "fp-ts/lib/Either";
import * as O from "fp-ts/lib/Option";
import * as RE from "fp-ts/lib/ReaderEither";
import { pipe } from "fp-ts/lib/function";

type Actions = "requestSyncLegacy";

type NoAction = typeof noAction;
type Action<A extends Actions, B> = Record<A, B>;
type RequestSyncLegacyAction = Action<
  "requestSyncLegacy",
  Queue.RequestSyncLegacyItem
>;
const noAction = {};

const toLegacyService = (
  serviceHistory: ServiceHistory
): Queue.RequestSyncLegacyItem => {
  // TODO: implement mapping
  return {} as Queue.RequestSyncLegacyItem;
};

const toRequestSyncLegacyAction = (
  serviceHistory: ServiceHistory
): RequestSyncLegacyAction => ({
  requestSyncLegacy: toLegacyService(serviceHistory),
});

export const handler: RE.ReaderEither<
  { item: ServiceHistory },
  Error,
  NoAction | RequestSyncLegacyAction
> = ({ item }) =>
  pipe(
    item,
    O.fromPredicate((itm) => itm.fsm.lastTransition !== "from Legacy"),
    O.map(toRequestSyncLegacyAction),
    O.getOrElse(() => noAction),
    E.right
  );
