/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { getConfiguration } from "@/config";
import mixpanel from "mixpanel-browser";

type ApiKeyType = "primary" | "secondary";
interface MixPanelEventsStructure {
  readonly IO_BO_APIKEY_PAGE: {};
  readonly IO_BO_INSTITUTION_SWITCH: {
    switchToInstitutionId: string;
  };
  readonly IO_BO_LOGIN: {};
  readonly IO_BO_MANAGE_KEY_COPY: {
    entryPoint: string;
    keyType: ApiKeyType;
  };
  readonly IO_BO_MANAGE_KEY_ROTATE: {
    keyType: ApiKeyType;
  };
  readonly IO_BO_OVERVIEW_PAGE: {};
  readonly IO_BO_PRODUCT_SWITCH: { productId: string };
  readonly IO_BO_SERVICE_CREATE_ABORT: {};
  readonly IO_BO_SERVICE_CREATE_END: {
    result: string;
    serviceId: string;
  };
  readonly IO_BO_SERVICE_CREATE_START: {};
  readonly IO_BO_SERVICE_DETAILS: { serviceId: string };
  readonly IO_BO_SERVICE_DETAILS_PAGE: {
    serviceId: string;
    serviceName: string;
  };
  readonly IO_BO_SERVICE_EDIT_ABORT: {};

  readonly IO_BO_SERVICE_EDIT_END: {
    result: string;
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
  readonly IO_BO_SERVICES_IMPORT_END: { result: string };
  readonly IO_BO_SERVICES_IMPORT_OPEN: {};
  readonly IO_BO_SERVICES_IMPORT_START: {
    delegates: string[];
  };
  readonly IO_BO_SERVICES_PAGE: {};
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface OperationId<Event extends MixPanelEventsStructure> {
  eventKey: Extract<keyof Event, string>;
}

export const logToMixpanel = <T extends keyof MixPanelEventsStructure>(
  operationId: T,
  eventCategory: "TECH" | "UX",
  mixpanelEventData: MixPanelEvents<T>,
  eventType?: "action" | "screen_view",
) => {
  let currentEvent;
  let currentEventData;

  // check to avoid multiple logs
  if (currentEvent !== operationId || currentEventData !== mixpanelEventData) {
    currentEvent = operationId;
    currentEventData = mixpanelEventData;
    const categorizedEventData = {
      eventCategory,
      eventType,
      ...mixpanelEventData,
    };

    mixpanel.track(operationId, categorizedEventData);
  }
};

// Functions for IO_BO_APIKEY_PAGE
export const trackApiKeyPageEvent = () => {
  logToMixpanel("IO_BO_APIKEY_PAGE", "UX", {}, "screen_view");
};

// Function for IO_BO_INSTITUTION_SWITCH
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

// Function for IO_BO_LOGIN
export const trackLoginEvent = () => {
  logToMixpanel("IO_BO_LOGIN", "UX", {}, "screen_view");
};

// Function for IO_BO_MANAGE_KEY_COPY
export const trackManageKeyCopyEvent = (
  entryPoint: string,
  keyType: ApiKeyType,
) => {
  logToMixpanel(
    "IO_BO_MANAGE_KEY_COPY",
    "UX",
    {
      entryPoint: entryPoint,
      keyType: keyType,
    },
    "action",
  );
};

// Function for IO_BO_MANAGE_KEY_ROTATE
export const trackManageKeyRotateEvent = (keyType: ApiKeyType) => {
  logToMixpanel(
    "IO_BO_MANAGE_KEY_ROTATE",
    "UX",
    {
      keyType: keyType,
    },
    "action",
  );
};

// Function for IO_BO_OVERVIEW_PAGE
export const trackOverviewPageEvent = () => {
  logToMixpanel("IO_BO_OVERVIEW_PAGE", "UX", {}, "screen_view");
};

// Function for IO_BO_PRODUCT_SWITCH
export const trackProductSwitchEvent = (productId: string) => {
  logToMixpanel(
    "IO_BO_PRODUCT_SWITCH",
    "UX",
    {
      productId: productId,
    },
    "action",
  );
};

// Function for IO_BO_SERVICE_CREATE_ABORT
export const trackServiceCreateAbortEvent = () => {
  logToMixpanel("IO_BO_SERVICE_CREATE_ABORT", "UX", {}, "action");
};

// Function for IO_BO_SERVICE_CREATE_END
export const trackServiceCreateEndEvent = (
  result: string,
  serviceId: string,
) => {
  logToMixpanel("IO_BO_SERVICE_CREATE_END", "TECH", {
    result: result,
    serviceId: serviceId, // Missing New servie ID
  });
};

// Function for IO_BO_SERVICE_CREATE_START
export const trackServiceCreateStartEvent = () => {
  logToMixpanel("IO_BO_SERVICE_CREATE_START", "UX", {}, "action");
};

// Function for IO_BO_SERVICE_DETAILS
export const trackServiceDetailsEvent = (serviceId: string) => {
  logToMixpanel(
    "IO_BO_SERVICE_DETAILS",
    "UX",
    {
      serviceId: serviceId,
    },
    "action",
  );
};

// Function for IO_BO_SERVICE_DETAILS_PAGE
export const trackServiceDetailsPageEvent = (
  serviceId: string,
  serviceName: string,
) => {
  logToMixpanel(
    "IO_BO_SERVICE_DETAILS_PAGE",
    "UX",
    {
      serviceId: serviceId,
      serviceName: serviceName,
    },
    "screen_view",
  );
};

// Function for IO_BO_SERVICE_EDIT_ABORT
export const trackServiceEditAbortEvent = () => {
  logToMixpanel("IO_BO_SERVICE_EDIT_ABORT", "UX", {}, "action");
};

// Function for IO_BO_SERVICE_EDIT_END
export const trackServiceEditEndEvent = (result: string, serviceId: string) => {
  logToMixpanel("IO_BO_SERVICE_EDIT_END", "TECH", {
    result: result,
    serviceId: serviceId,
  });
};

// Function for IO_BO_SERVICE_EDIT_START
export const trackServiceEditStartEvent = (
  entryPoint: string,
  serviceId: string,
) => {
  logToMixpanel(
    "IO_BO_SERVICE_EDIT_START",
    "UX",
    {
      entryPoint: entryPoint,
      serviceId: serviceId,
    },
    "action",
  );
};

// Function for IO_BO_SERVICE_HISTORY
export const trackServiceHistoryEvent = (serviceId: string) => {
  logToMixpanel(
    "IO_BO_SERVICE_HISTORY",
    "UX",
    {
      serviceId: serviceId,
    },
    "action",
  );
};

// Function for IO_BO_SERVICE_KEY_COPY
export const trackServiceKeyCopyEvent = (keyType: ApiKeyType) => {
  logToMixpanel(
    "IO_BO_SERVICE_KEY_COPY",
    "UX",
    {
      keyType: keyType,
    },
    "action",
  );
};

// Function for IO_BO_SERVICE_KEY_ROTATE
export const trackServiceKeyRotateEvent = (keyType: ApiKeyType) => {
  logToMixpanel(
    "IO_BO_SERVICE_KEY_ROTATE",
    "UX",
    {
      keyType: keyType,
    },
    "action",
  );
};

// Function for IO_BO_SERVICE_PREVIEW
export const trackServicePreviewEvent = (serviceId: string) => {
  logToMixpanel(
    "IO_BO_SERVICE_PREVIEW",
    "UX",
    {
      serviceId: serviceId,
    },
    "action",
  );
};

// Function for IO_BO_SERVICES_IMPORT_END
export const trackServicesImportEndEvent = (result: string) => {
  logToMixpanel("IO_BO_SERVICES_IMPORT_END", "TECH", {
    result: result,
  });
};

// Function for IO_BO_SERVICES_IMPORT_OPEN
export const trackServicesImportOpenEvent = () => {
  logToMixpanel("IO_BO_SERVICES_IMPORT_OPEN", "UX", {}, "action");
};

// Function for IO_BO_SERVICES_IMPORT_START
export const trackServicesImportStartEvent = (delegates: string[]) => {
  logToMixpanel(
    "IO_BO_SERVICES_IMPORT_START",
    "UX",
    {
      delegates: delegates,
    },
    "action",
  );
};

// Function for IO_BO_SERVICES_PAGE
export const trackServicesPageEvent = () => {
  logToMixpanel("IO_BO_SERVICES_PAGE", "UX", {}, "screen_view");
};
