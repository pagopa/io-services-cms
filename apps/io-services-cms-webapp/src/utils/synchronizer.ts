import {
  ServiceHistory,
  ServiceLifecycle,
  ServicePublication,
} from "@io-services-cms/models";
import * as RA from "fp-ts/ReadonlyArray";
import { pipe } from "fp-ts/lib/function";

// Skip sync to legacy if the service was synced from legacy (Service History Watcher)
export const SYNC_FROM_LEGACY = "sync from Legacy";

// Skip sync to legacy, in case of manual intervention on a service (Service History Watcher)
export const SKIP_SYNC_TO_LEGACY_PREFIX = "skip sync to Legacy";

// Calculate if a watcher should skip a service
export const shouldSkipSync = (
  {
    fsm: { lastTransition },
  }: ServiceHistory | ServiceLifecycle.ItemType | ServicePublication.ItemType,
  skipList: readonly string[],
): boolean =>
  pipe(
    skipList,
    RA.some((s) => !!lastTransition && lastTransition.startsWith(s)),
  );
