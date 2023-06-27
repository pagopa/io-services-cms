import {
  Queue,
  ServiceHistory,
  ServicePublication,
} from "@io-services-cms/models";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as E from "fp-ts/lib/Either";
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

const onReleaseHandler = (
  item: ServicePublication.ItemType
): RequestSyncLegacyAction => ({
  requestSyncLegacy: {
    ...item,
    last_update:
      item.last_update ?? (new Date().toISOString() as NonEmptyString), // last_update fallback (value is always set by persistence layer) TODO add log
  },
});

export const handler: RE.ReaderEither<
  { item: ServiceHistory },
  Error,
  NoAction | RequestSyncLegacyAction
> = ({ item }) => {
  if (item.fsm.lastTransition === "from Legacy") {
    switch (item.fsm.state) {
      case "unpublished":
      case "published":
        return pipe(item, onReleaseHandler, E.right);
      default:
        return E.right(noAction);
    }
  } else {
    return E.right(noAction);
  }
};
