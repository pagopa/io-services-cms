/* eslint-disable @typescript-eslint/no-unused-vars */
import { FSMStore, ServiceLifecycle } from "@io-services-cms/models";
import { JiraProxy } from "./utils/jira-proxy";
import { ServiceReviewDao } from "./utils/service-review-dao";

export const createReviewCheckerHandler = (
  dao: ServiceReviewDao,
  jiraProxy: JiraProxy,
  serviceLifecycleStore: FSMStore<ServiceLifecycle.ItemType>
): Promise<unknown> => {
  throw new Error("Not implemented yet");
};
