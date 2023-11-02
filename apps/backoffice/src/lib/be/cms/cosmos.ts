import * as O from "fp-ts/lib/Option";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";
import {
  getServiceLifecycleCosmosStore,
  getServicePublicationCosmosStore
} from "@/lib/be/cosmos-store";

export const retrieveLifecycleServices = (subscriptions: Array<string>) =>
  pipe(
    getServiceLifecycleCosmosStore().bulkFetch(subscriptions),
    TE.map(maybeServiceList => maybeServiceList.filter(O.isSome)),
    TE.map(maybeServiceList => maybeServiceList.map(v => v.value))
  );

export const retrievePublicationServices = (subscriptions: Array<string>) =>
  pipe(
    getServicePublicationCosmosStore().bulkFetch(subscriptions),
    TE.map(maybeServiceList => maybeServiceList.filter(O.isSome)),
    TE.map(maybeServiceList => maybeServiceList.map(v => v.value))
  );
