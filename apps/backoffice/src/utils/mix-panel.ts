/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { getConfiguration } from "@/config";
import mixpanel from "mixpanel-browser";
interface MixPanelEventsStructure {
  readonly IO_BO_APIKEY_PAGE: {};
  readonly IO_BO_INSTITUTION_SWITCH: {
    institutionId: string;
  };
  readonly IO_BO_LOGIN: {};
  readonly IO_BO_MANAGE_KEY_COPY: {
    entryPoint: string;
    keyType: "primary" | "secondary";
  };
  readonly IO_BO_MANAGE_KEY_ROTATE: {
    keyType: "primary" | "secondary";
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
    keyType: "primary" | "secondary";
  };
  readonly IO_BO_SERVICE_KEY_ROTATE: {
    keyType: "primary" | "secondary";
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
) => {
  let currentEvent;
  let currentEventData;

  // check to avoid multiple logs
  if (currentEvent !== operationId || currentEventData !== mixpanelEventData) {
    currentEvent = operationId;
    currentEventData = mixpanelEventData;
    const categorizedEventData = { eventCategory, ...mixpanelEventData };

    mixpanel.track(operationId, categorizedEventData);
  }
};
