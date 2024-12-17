import { SubscriptionState } from "@azure/arm-apimanagement";
import { Context } from "@azure/functions";
import { ApimUtils } from "@io-services-cms/external-clients";
import { ServiceLifecycle } from "@io-services-cms/models";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import * as B from "fp-ts/boolean";
import * as RTE from "fp-ts/lib/ReaderTaskEither";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

export type GroupChangeEvent = t.TypeOf<typeof GroupChangeEvent>;
export const GroupChangeEvent = t.type({
  id: NonEmptyString,
  institutionId: NonEmptyString,
  name: NonEmptyString,
  productId: NonEmptyString,
  status: t.union([
    t.literal("ACTIVE"),
    t.literal("SUSPENDED"),
    t.literal("DELETED"),
  ]),
});

interface HandlerDependencies {
  apimService: ApimUtils.ApimService;
  serviceLifecycleStore: ServiceLifecycle.LifecycleStore;
}

let i = 0;

export const makeHandler: (
  handlerDependencies: HandlerDependencies,
) => RTE.ReaderTaskEither<
  { context: Context; item: GroupChangeEvent },
  Error,
  void
> =
  (handlerDependencies) =>
  ({ context, item }) => {
    context.log.info("INVOCATION COUNTER", ++i, "GROUP_ID", item.id);
    if (item.name.endsWith("fail")) {
      throw new Error(`TEST FAILURE: INVOCATION ${i}, GROUP_ID ${item.id}`);
    }
    return pipe(
      item.productId === "prod-io",
      B.fold(
        () => TE.right(void 0),
        () =>
          pipe(
            item,
            ioGroupChangeHandler(handlerDependencies),
            // TE.orElse((_) =>
            //   pipe(item, ioGroupChangeHandler(handlerDependencies)),
            // ),
          ),
      ),
    );
  };
export const ioGroupChangeHandler: (
  handlerDependencies: HandlerDependencies,
) => RTE.ReaderTaskEither<GroupChangeEvent, Error, void> =
  ({ apimService, serviceLifecycleStore }) =>
  (group) =>
    pipe(
      group,
      syncSubscription(apimService),
      TE.chain((_) => syncServices(serviceLifecycleStore)(group)),
    );

const syncSubscription =
  (apimService: ApimUtils.ApimService) =>
  (group: GroupChangeEvent): TE.TaskEither<Error, void> =>
    pipe(
      apimService.getSubscription(
        ApimUtils.SUBSCRIPTION_MANAGE_GROUP_PREFIX + group.id,
      ),
      TE.chain((subscription) =>
        subscription.displayName !== group.name ||
        subscription.state !== mapStateFromGroupToSubscription(group.status)
          ? apimService.updateSubscription(
              subscription.name ?? "",
              {
                displayName: group.name,
                state: mapStateFromGroupToSubscription(group.status),
              },
              subscription.eTag,
            )
          : TE.right(void 0),
      ),
      TE.map(() => void 0),
      TE.orElse((e) =>
        "statusCode" in e
          ? e.statusCode === 404
            ? TE.right(void 0)
            : TE.left(
                new Error(
                  `Failed to update subcription ${group.id}, reason: ${JSON.stringify(e.details)}`,
                ),
              )
          : TE.left(e),
      ),
    );

const mapStateFromGroupToSubscription = (
  status: GroupChangeEvent["status"],
): SubscriptionState => {
  switch (status) {
    case "ACTIVE":
      return "active";
    case "SUSPENDED":
      return "suspended";
    case "DELETED":
      return "cancelled";
    default:
      // eslint-disable-next-line no-case-declarations, @typescript-eslint/no-unused-vars
      const _: never = status;
      throw new Error("Invalid status");
  }
};

const syncServices =
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
