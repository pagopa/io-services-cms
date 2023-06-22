import {
  Queue,
  ServiceLifecycle,
  ServicePublication,
} from "@io-services-cms/models";
import { Service } from "@pagopa/io-functions-commons/dist/src/models/service";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

export const LegacyService = t.intersection([
  Service,
  t.partial({
    csmTag: t.boolean,
  }),
]);
export type LegacyService = t.TypeOf<typeof LegacyService>;
const noAction = {};
type NoAction = typeof noAction;
type Actions = "requestSyncCms";
type Action<A extends Actions, B> = Record<A, B>;
type RequestSyncCmsAction = Action<"requestSyncCms", Queue.RequestSyncCmsItem>;

const onLegacyServiceChangeHandler = (item: Service): RequestSyncCmsAction => ({
  requestSyncCms: legacyToCms(item),
});

const legacyToCms = (item: Service): Queue.RequestSyncCmsItem => {
  // TODO: implement mapping
  if (item.isVisible) {
    return {} as ServicePublication.ItemType;
  } else {
    return {} as ServiceLifecycle.ItemType;
  }
};

export const handler: RTE.ReaderTaskEither<
  { item: LegacyService },
  Error,
  NoAction | RequestSyncCmsAction
> = ({ item }) => {
  if (!!item.csmTag && item.csmTag) {
    return pipe(item, onLegacyServiceChangeHandler, TE.right);
  } else {
    return TE.right(noAction);
  }
};
