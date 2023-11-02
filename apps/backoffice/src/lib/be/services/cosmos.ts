import {
  getServiceLifecycleCosmosStore,
  getServicePublicationCosmosStore
} from "@/lib/be/cosmos-store";
import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import * as B from "fp-ts/lib/boolean";
import { pipe } from "fp-ts/lib/function";

export const retrieveLifecycleServices = (subscriptions: Array<string>) =>
  pipe(
    subscriptions.length > 0,
    B.fold(
      () => TE.of([]),
      () =>
        pipe(
          getServiceLifecycleCosmosStore().bulkFetch(subscriptions),
          TE.map(maybeServiceList => maybeServiceList.filter(O.isSome)),
          TE.map(maybeServiceList => maybeServiceList.map(v => v.value))
        )
    )
  );

export const retrievePublicationServices = (subscriptions: Array<string>) =>
  pipe(
    subscriptions.length > 0,
    B.fold(
      () => TE.of([]),
      () =>
        pipe(
          getServicePublicationCosmosStore().bulkFetch(subscriptions),
          TE.map(maybeServiceList => maybeServiceList.filter(O.isSome)),
          TE.map(maybeServiceList => maybeServiceList.map(v => v.value))
        )
    )
  );
