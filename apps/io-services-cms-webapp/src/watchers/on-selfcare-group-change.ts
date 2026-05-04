import { ApimUtils, SelfcareUtils } from "@io-services-cms/external-clients";
import { ServiceLifecycle } from "@io-services-cms/models";
import * as RTE from "fp-ts/lib/ReaderTaskEither";

import {
  GroupChangeEvent,
  handleGroupChangeEvent,
} from "../utils/selfcare-group-change";

interface HandlerDependencies {
  apimService: ApimUtils.ApimService;
  apimUserGroups: readonly string[];
  selfcareClient: SelfcareUtils.SelfcareClient;
  serviceLifecycleStore: ServiceLifecycle.LifecycleStore;
}

export const makeHandler: (
  handlerDependencies: HandlerDependencies,
) => RTE.ReaderTaskEither<{ item: GroupChangeEvent }, Error, void> =
  ({ apimService, apimUserGroups, selfcareClient, serviceLifecycleStore }) =>
  ({ item }) =>
    handleGroupChangeEvent({
      apimService,
      apimUserGroups,
      selfcareClient,
      serviceLifecycleStore,
    })(item);
