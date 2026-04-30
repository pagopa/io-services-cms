import { ApimUtils } from "@io-services-cms/external-clients";
import { ServiceLifecycle } from "@io-services-cms/models";
import * as TE from "fp-ts/lib/TaskEither";

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
  (item: GroupChangeEvent): TE.TaskEither<Error, void> => {
    if (item.productId !== "prod-io") {
      return TE.right(void 0);
    }

    const tasks: readonly TE.TaskEither<Error, void>[] = [
      createSubscriptionForGroup(apimService)(item),
      syncSubscription(apimService)(item),
      syncServices(serviceLifecycleStore)(item),
    ];

    return TE.map(() => void 0)(TE.sequenceSeqArray(tasks));
  };
