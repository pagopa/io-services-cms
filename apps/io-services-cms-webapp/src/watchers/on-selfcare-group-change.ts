import { ApimUtils } from "@io-services-cms/external-clients";
import { ServiceLifecycle } from "@io-services-cms/models";
import * as RTE from "fp-ts/lib/ReaderTaskEither";

import {
  GroupChangeEvent,
  handleGroupChangeEvent,
} from "../utils/selfcare-group-change";

interface HandlerDependencies {
  apimService: ApimUtils.ApimService;
  serviceLifecycleStore: ServiceLifecycle.LifecycleStore;
}

export const makeHandler: (
  handlerDependencies: HandlerDependencies,
) => RTE.ReaderTaskEither<{ item: GroupChangeEvent }, Error, void> =
  ({ apimService, serviceLifecycleStore }) =>
  ({ item }) =>
    handleGroupChangeEvent({ apimService, serviceLifecycleStore })(item);
