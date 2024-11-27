import {
  getServiceLifecycleCosmosStore,
  getServicePublicationCosmosStore,
} from "@/lib/be/cosmos-store";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import * as B from "fp-ts/lib/boolean";
import { pipe } from "fp-ts/lib/function";

export const retrieveLifecycleServices = (subscriptions: string[]) =>
  pipe(
    subscriptions.length > 0,
    B.fold(
      () => TE.of([]),
      () =>
        pipe(
          getServiceLifecycleCosmosStore().bulkFetch(subscriptions),
          TE.map((maybeServiceList) => maybeServiceList.filter(O.isSome)),
          TE.map((maybeServiceList) => maybeServiceList.map((v) => v.value)),
        ),
    ),
  );

export const retrievePublicationServices = (subscriptions: string[]) =>
  pipe(
    subscriptions.length > 0,
    B.fold(
      () => TE.of([]),
      () =>
        pipe(
          getServicePublicationCosmosStore().bulkFetch(subscriptions),
          TE.map((maybeServiceList) => maybeServiceList.filter(O.isSome)),
          TE.map((maybeServiceList) => maybeServiceList.map((v) => v.value)),
        ),
    ),
  );

export const retrieveAuthorizedServiceIds = (
  authzGroupIds: readonly string[],
): TE.TaskEither<Error, readonly string[]> =>
  pipe(
    authzGroupIds.length > 0,
    B.match(
      () => TE.of([]),
      () =>
        getServiceLifecycleCosmosStore().getServiceIdsByGroupIds(authzGroupIds),
    ),
  );

export const retrieveGroupUnboundedServices = (
  serviceIds: readonly string[],
): TE.TaskEither<Error, readonly { id: string; name: string }[]> =>
  pipe(
    serviceIds.length > 0,
    B.match(
      () => TE.of([]),
      () =>
        getServiceLifecycleCosmosStore().getGroupUnboundedServicesByIds(
          serviceIds,
        ),
    ),
  );
