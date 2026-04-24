import { ServiceLifecycle } from "@io-services-cms/models";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

import { GroupChangeEvent } from "./types";

export const syncServices =
  (serviceLifecycleStore: ServiceLifecycle.LifecycleStore) =>
  (group: GroupChangeEvent): TE.TaskEither<Error, void> =>
    group.status === "DELETED"
      ? pipe(
          serviceLifecycleStore.executeOnServicesFilteredByGroupId(
            group.id,
            (serviceIds) =>
              pipe(
                serviceIds.map((sid) => ({
                  data: {
                    metadata: {
                      group_id: undefined,
                    },
                  },
                  id: sid,
                })),
                serviceLifecycleStore.bulkPatch,
                TE.chain((results) =>
                  results.some((result) => result.statusCode !== 200)
                    ? TE.left(new Error("At least one patch operation failed"))
                    : TE.right(void 0),
                ),
              ),
          ),
        )
      : TE.right(void 0);
