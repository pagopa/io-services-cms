import { ApimUtils } from "@io-services-cms/external-clients";
import { ServiceLifecycle } from "@io-services-cms/models";
import * as B from "fp-ts/boolean";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import {
  GroupChangeEvent,
  syncServices,
  syncSubscription,
} from "../utils/sync-group-utils";

interface HandlerDependencies {
  apimService: ApimUtils.ApimService;
  serviceLifecycleStore: ServiceLifecycle.LifecycleStore;
}

export const makeHandler: (
  handlerDependencies: HandlerDependencies,
) => RTE.ReaderTaskEither<{ item: GroupChangeEvent }, Error, void> =
  ({ apimService, serviceLifecycleStore }) =>
  ({ item }) =>
    pipe(
      item.productId === "prod-io",
      B.fold(
        () => TE.right(void 0),
        () =>
          pipe(
            item,
            syncSubscription(apimService),
            TE.chain((_) => syncServices(serviceLifecycleStore)(item)),
          ),
      ),
    );
