/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { getConfiguration } from "@/config";
import mixpanel from "mixpanel-browser";
interface MixPanelEventsStructure {
  readonly IO_BO_APIKEY_PAGE: { eventCategory: string };
  readonly IO_BO_INSTITUTION_SWITCH: {
    eventCategory: string;
    institutionId: string;
  };
  readonly IO_BO_LOGIN: { eventCategory: string };
  readonly IO_BO_MANAGE_KEY_COPY: {
    entryPoint: string;
    eventCategory: string;
    keyType: "primary" | "secondary";
  };
  readonly IO_BO_MANAGE_KEY_ROTATE: {
    eventCategory: string;
    keyType: "primary" | "secondary";
  };
  readonly IO_BO_OVERVIEW_PAGE: { eventCategory: string };
  readonly IO_BO_PRODUCT_SWITCH: { eventCategory: string; productId: string };
  readonly IO_BO_SERVICE_CREATE_ABORT: { eventCategory: string };
  readonly IO_BO_SERVICE_CREATE_END: {
    eventCategory: string;
    result: string;
    serviceId: string;
  };
  readonly IO_BO_SERVICE_CREATE_START: { eventCategory: string };
  readonly IO_BO_SERVICE_DETAILS: { eventCategory: string; serviceId: string };
  readonly IO_BO_SERVICE_DETAILS_PAGE: {
    eventCategory: string;
    serviceId: string;
    serviceName: string;
  };
  readonly IO_BO_SERVICE_EDIT_ABORT:
    | { eventCategory: string }
    | any
    | null
    | undefined;
  readonly IO_BO_SERVICE_EDIT_END: {
    eventCategory: string;
    result: string;
    serviceId: string;
  };
  readonly IO_BO_SERVICE_EDIT_START: {
    entryPoint: string;
    eventCategory: string;
    serviceId: string;
  };
  readonly IO_BO_SERVICE_HISTORY: { eventCategory: string; serviceId: string };
  readonly IO_BO_SERVICE_KEY_COPY: {
    eventCategory: string;
    keyType: "primary" | "secondary";
  };
  readonly IO_BO_SERVICE_KEY_ROTATE: {
    eventCategory: string;
    keyType: "primary" | "secondary";
  };
  readonly IO_BO_SERVICE_PREVIEW: { eventCategory: string; serviceId: string };
  readonly IO_BO_SERVICES_IMPORT_END: { eventCategory: string; result: string };
  readonly IO_BO_SERVICES_IMPORT_OPEN: { eventCategory: string };
  readonly IO_BO_SERVICES_IMPORT_START: {
    delegates: string[];
    eventCategory: string;
  };
  readonly IO_BO_SERVICES_PAGE: { eventCategory: string };
}

export const mixpanelSetup = () => {
  mixpanel.init(getConfiguration().BACK_OFFICE_MIXPANEL_TOKEN, {
    debug: true,
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
  mixpanelEventData: MixPanelEvents<T>,
) => {
  let currentEvent;
  let currentEventData;

  // check to avoid multiple logs
  if (currentEvent !== operationId || currentEventData !== mixpanelEventData) {
    currentEvent = operationId;
    currentEventData = mixpanelEventData;
    mixpanel.track(operationId, mixpanelEventData);
  }
};
