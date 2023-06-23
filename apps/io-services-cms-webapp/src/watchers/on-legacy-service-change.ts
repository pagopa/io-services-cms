import {
  Queue,
  ServiceLifecycle,
  ServicePublication,
} from "@io-services-cms/models";
import { Service } from "@pagopa/io-functions-commons/dist/src/models/service";
import * as E from "fp-ts/lib/Either";
import * as RE from "fp-ts/lib/ReaderEither";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

export const LegacyService = t.intersection([
  Service,
  t.partial({
    cmsTag: t.boolean,
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

export const handler: RE.ReaderEither<
  { item: LegacyService },
  Error,
  NoAction | RequestSyncCmsAction
> = ({ item }) => {
  if (item.cmsTag) {
    return pipe(item, onLegacyServiceChangeHandler, E.right);
  } else {
    return E.right(noAction);
  }
};
