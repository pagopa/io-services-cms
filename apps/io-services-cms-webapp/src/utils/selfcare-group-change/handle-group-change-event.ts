import { ApimUtils } from "@io-services-cms/external-clients";
import { ServiceLifecycle } from "@io-services-cms/models";
import * as B from "fp-ts/boolean";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { createSubscriptionForGroup } from "./create-manage-group-subscription";
import { syncServices } from "./sync-services";
import { syncSubscription } from "./sync-subscription";
import { GroupChangeEvent } from "./types";

interface HandlerDependencies {
  apimService: ApimUtils.ApimService;
  serviceLifecycleStore: ServiceLifecycle.LifecycleStore;
}

export const handleGroupChangeEvent =
  ({ apimService, serviceLifecycleStore }: HandlerDependencies) =>
  (item: GroupChangeEvent): TE.TaskEither<Error, void> =>
    pipe(
      item.productId === "prod-io",
      B.fold(
        () => TE.right(void 0),
        () =>
          pipe(
            item,
            createSubscriptionForGroup(apimService),
            TE.chain((_) => syncSubscription(apimService)(item)),
            TE.chain((_) => syncServices(serviceLifecycleStore)(item)),
          ),
      ),
    );
