/* eslint-disable perfectionist/sort-interfaces */

import { getConfiguration } from "@/config";
import mixpanel from "mixpanel-browser";

export type TechEventResult = "error" | "success";

type ApiKeyType = "primary" | "secondary";

interface MixPanelEventsStructure {
  readonly IO_BO_APIKEY_PAGE: Record<string, never>;
  readonly IO_BO_INSTITUTION_SWITCH: {
    switchToInstitutionId: string;
  };
  readonly IO_BO_LOGIN: Record<string, never>;
  readonly IO_BO_LOGIN_ERROR: { reason: string };
  readonly IO_BO_MANAGE_KEY_COPY: {
    entryPoint: string;
    keyType: ApiKeyType;
  };
  readonly IO_BO_MANAGE_KEY_ROTATE: {
    keyType: ApiKeyType;
  };
  readonly IO_BO_OVERVIEW_PAGE: Record<string, never>;
  readonly IO_BO_PRODUCT_SWITCH: { productId: string };
  readonly IO_BO_SERVICE_CREATE_ABORT: { stepIndex: number };
  readonly IO_BO_SERVICE_CREATE_END: {
    result: TechEventResult;
    serviceId?: string;
  };
  readonly IO_BO_SERVICE_CREATE_START: Record<string, never>;
  readonly IO_BO_SERVICE_DETAILS: { serviceId: string };
  readonly IO_BO_SERVICE_DETAILS_PAGE: {
    serviceId: string;
    serviceName: string;
  };
  readonly IO_BO_SERVICE_EDIT_ABORT: { stepIndex: number };
  readonly IO_BO_SERVICE_EDIT_END: {
    result: TechEventResult;
    serviceId: string;
  };
  readonly IO_BO_SERVICE_EDIT_START: {
    entryPoint: string;
    serviceId: string;
  };
  readonly IO_BO_SERVICE_HISTORY: { serviceId: string };
  readonly IO_BO_SERVICE_KEY_COPY: {
    keyType: ApiKeyType;
  };
  readonly IO_BO_SERVICE_KEY_ROTATE: {
    keyType: ApiKeyType;
  };
  readonly IO_BO_SERVICE_PREVIEW: { serviceId: string };
  readonly IO_BO_SERVICES_IMPORT_END: { result: TechEventResult };
  readonly IO_BO_SERVICES_IMPORT_OPEN: Record<string, never>;
  readonly IO_BO_SERVICES_IMPORT_START: {
    delegates: string[];
  };
  readonly IO_BO_SERVICES_PAGE: Record<string, never>;

  readonly IO_BO_GROUP_KEY_GENERATE_START: Record<string, never>;
  readonly IO_BO_GROUP_KEY_GENERATE_END: { result: TechEventResult };
  readonly IO_BO_GROUP_KEY_GENERATE_ABORT: Record<string, never>;
  readonly IO_BO_GROUP_KEY_DELETE: { subscriptionId: string };
  readonly IO_BO_GROUP_KEY_ROTATE: { keyType: ApiKeyType };
  readonly IO_BO_GROUP_KEY_COPY: { keyType: ApiKeyType };
  readonly IO_BO_SERVICE_GROUP_ASSIGNMENT: Record<string, never>;
  readonly IO_BO_SERVICE_GROUP_ASSIGNMENT_MODIFY: Record<string, never>;
  readonly IO_BO_SERVICE_GROUP_ASSIGNMENT_DELETE: Record<string, never>;
  readonly IO_BO_BULK_GROUP_ASSIGNMENT_START: Record<string, never>;
  readonly IO_BO_BULK_GROUP_ASSIGNMENT_END: { result: TechEventResult };
  readonly IO_BO_BULK_GROUP_ASSIGNMENT_ABORT: Record<string, never>;
}

export const mixpanelSetup = () => {
  mixpanel.init(getConfiguration().BACK_OFFICE_MIXPANEL_TOKEN, {
    debug: false,
    ignore_dnt: true,
    persistence: "localStorage",
    track_pageview: false,
    verbose: true,
  });
};

type MixPanelEvents<T extends keyof MixPanelEventsStructure> =
  MixPanelEventsStructure[T];

const logToMixpanel = <T extends keyof MixPanelEventsStructure>(
  operationId: T,
  eventCategory: "TECH" | "UX",
  mixpanelEventData: MixPanelEvents<T>,
  eventType?: "action" | "screen_view",
) => {
  const categorizedEventData = {
    eventCategory,
    eventType,
    ...mixpanelEventData,
  };
  mixpanel.track(operationId, categorizedEventData);
};

export const trackApiKeyPageEvent = () => {
  logToMixpanel("IO_BO_APIKEY_PAGE", "UX", {}, "screen_view");
};

export const trackInstitutionSwitchEvent = (id: string) => {
  logToMixpanel(
    "IO_BO_INSTITUTION_SWITCH",
    "UX",
    {
      switchToInstitutionId: id,
    },
    "action",
  );
};

export const trackLoginEvent = () => {
  logToMixpanel("IO_BO_LOGIN", "UX", {}, "screen_view");
};

export const trackLoginErrorEvent = (reason: string) => {
  logToMixpanel("IO_BO_LOGIN_ERROR", "UX", { reason }, "screen_view");
};

export const trackManageKeyCopyEvent = (
  entryPoint: string,
  keyType: ApiKeyType,
) => {
  logToMixpanel(
    "IO_BO_MANAGE_KEY_COPY",
    "UX",
    {
      entryPoint,
      keyType,
    },
    "action",
  );
};

export const trackManageKeyRegenerateEvent = (keyType: ApiKeyType) => {
  logToMixpanel(
    "IO_BO_MANAGE_KEY_ROTATE",
    "UX",
    {
      keyType,
    },
    "action",
  );
};

export const trackOverviewPageEvent = () => {
  logToMixpanel("IO_BO_OVERVIEW_PAGE", "UX", {}, "screen_view");
};

export const trackProductSwitchEvent = (productId: string) => {
  logToMixpanel(
    "IO_BO_PRODUCT_SWITCH",
    "UX",
    {
      productId,
    },
    "action",
  );
};

export const trackServiceCreateAbortEvent = (stepIndex: number) => {
  logToMixpanel("IO_BO_SERVICE_CREATE_ABORT", "UX", { stepIndex }, "action");
};

export const trackServiceCreateEndEvent = (
  result: TechEventResult,
  serviceId?: string,
) => {
  logToMixpanel("IO_BO_SERVICE_CREATE_END", "TECH", {
    result,
    serviceId, // Missing New servie ID
  });
};

export const trackServiceCreateStartEvent = () => {
  logToMixpanel("IO_BO_SERVICE_CREATE_START", "UX", {}, "action");
};

export const trackServiceDetailsEvent = (serviceId: string) => {
  logToMixpanel(
    "IO_BO_SERVICE_DETAILS",
    "UX",
    {
      serviceId,
    },
    "action",
  );
};

export const trackServiceDetailsPageEvent = (
  serviceId: string,
  serviceName: string,
) => {
  logToMixpanel(
    "IO_BO_SERVICE_DETAILS_PAGE",
    "UX",
    {
      serviceId,
      serviceName,
    },
    "screen_view",
  );
};

export const trackServiceEditAbortEvent = (stepIndex: number) => {
  logToMixpanel("IO_BO_SERVICE_EDIT_ABORT", "UX", { stepIndex }, "action");
};

export const trackServiceEditEndEvent = (
  result: TechEventResult,
  serviceId: string,
) => {
  logToMixpanel("IO_BO_SERVICE_EDIT_END", "TECH", {
    result,
    serviceId,
  });
};

export const trackServiceEditStartEvent = (
  entryPoint: string,
  serviceId: string,
) => {
  logToMixpanel(
    "IO_BO_SERVICE_EDIT_START",
    "UX",
    {
      entryPoint,
      serviceId,
    },
    "action",
  );
};

export const trackServiceHistoryEvent = (serviceId: string) => {
  logToMixpanel(
    "IO_BO_SERVICE_HISTORY",
    "UX",
    {
      serviceId,
    },
    "action",
  );
};

export const trackServiceKeyCopyEvent = (keyType: ApiKeyType) => {
  logToMixpanel(
    "IO_BO_SERVICE_KEY_COPY",
    "UX",
    {
      keyType,
    },
    "action",
  );
};

export const trackServiceKeyRegenerateEvent = (keyType: ApiKeyType) => {
  logToMixpanel(
    "IO_BO_SERVICE_KEY_ROTATE",
    "UX",
    {
      keyType,
    },
    "action",
  );
};

export const trackServicePreviewEvent = (serviceId: string) => {
  logToMixpanel(
    "IO_BO_SERVICE_PREVIEW",
    "UX",
    {
      serviceId,
    },
    "action",
  );
};

export const trackServicesImportEndEvent = (result: TechEventResult) => {
  logToMixpanel("IO_BO_SERVICES_IMPORT_END", "TECH", {
    result,
  });
};

export const trackServicesImportOpenEvent = () => {
  logToMixpanel("IO_BO_SERVICES_IMPORT_OPEN", "UX", {}, "action");
};

export const trackServicesImportStartEvent = (delegates: string[]) => {
  logToMixpanel(
    "IO_BO_SERVICES_IMPORT_START",
    "UX",
    {
      delegates,
    },
    "action",
  );
};

export const trackServicesPageEvent = () => {
  logToMixpanel("IO_BO_SERVICES_PAGE", "UX", {}, "screen_view");
};

// GROUP API KEYS

export const trackGroupKeyGenerateStartEvent = () => {
  logToMixpanel("IO_BO_GROUP_KEY_GENERATE_START", "UX", {}, "action");
};

export const trackGroupKeyGenerateEndEvent = (result: TechEventResult) => {
  logToMixpanel("IO_BO_GROUP_KEY_GENERATE_END", "TECH", {
    result,
  });
};

export const trackGroupKeyGenerateAbortEvent = () => {
  logToMixpanel("IO_BO_GROUP_KEY_GENERATE_ABORT", "UX", {}, "action");
};

export const trackGroupKeyDeleteEvent = (subscriptionId: string) => {
  logToMixpanel("IO_BO_GROUP_KEY_DELETE", "UX", { subscriptionId }, "action");
};

export const trackGroupKeyRegenerateEvent = (keyType: ApiKeyType) => {
  logToMixpanel("IO_BO_GROUP_KEY_ROTATE", "UX", { keyType }, "action");
};

export const trackGroupKeyCopyEvent = (keyType: ApiKeyType) => {
  logToMixpanel("IO_BO_GROUP_KEY_COPY", "UX", { keyType }, "action");
};

export const trackServiceGroupAssignmentEvent = () => {
  logToMixpanel("IO_BO_SERVICE_GROUP_ASSIGNMENT", "UX", {}, "action");
};

export const trackServiceGroupAssignmentModifyEvent = () => {
  logToMixpanel("IO_BO_SERVICE_GROUP_ASSIGNMENT_MODIFY", "UX", {}, "action");
};

export const trackServiceGroupAssignmentDeleteEvent = () => {
  logToMixpanel("IO_BO_SERVICE_GROUP_ASSIGNMENT_DELETE", "UX", {}, "action");
};

export const trackBulkGroupAssignmentStartEvent = () => {
  logToMixpanel("IO_BO_BULK_GROUP_ASSIGNMENT_START", "UX", {}, "action");
};

export const trackBulkGroupAssignmentEndEvent = (result: TechEventResult) => {
  logToMixpanel("IO_BO_BULK_GROUP_ASSIGNMENT_END", "TECH", {
    result,
  });
};

export const trackBulkGroupAssignmentAbortEvent = () => {
  logToMixpanel("IO_BO_BULK_GROUP_ASSIGNMENT_ABORT", "UX", {}, "action");
};
