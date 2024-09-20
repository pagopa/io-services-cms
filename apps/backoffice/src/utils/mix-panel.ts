import { getConfiguration } from "@/config";
import mixpanel from "mixpanel-browser";

type MixPanelEventsStructure = {
  readonly IO_BO_LOGIN: {} | null | any | undefined;
  readonly IO_BO_OVERVIEW_PAGE: {} | null | any | undefined;
  readonly IO_BO_SERVICES_PAGE: {} | null | any | undefined;
  readonly IO_BO_SERVICE_DETAILS_PAGE: {
    serviceId: string;
    serviceName: string;
  };
  readonly IO_BO_APIKEY_PAGE: {};
  readonly IO_BO_SERVICES_IMPORT_OPEN: {} | null | any | undefined;
  readonly IO_BO_SERVICES_IMPORT_START: { delegates: string[] };
  readonly IO_BO_SERVICES_IMPORT_END: { result: string };
  readonly IO_BO_SERVICE_CREATE_START: {} | null | any | undefined;
  readonly IO_BO_SERVICE_CREATE_END: { serviceId: string; result: string };
  readonly IO_BO_SERVICE_CREATE_ABORT: {} | null | any | undefined;
  readonly IO_BO_SERVICE_EDIT_START: { serviceId: string; entryPoint: string };
  readonly IO_BO_SERVICE_EDIT_END: { serviceId: string; result: string };
  readonly IO_BO_SERVICE_EDIT_ABORT: {} | null | any | undefined;
  readonly IO_BO_MANAGE_KEY_ROTATE: { keyType: "primary" | "secondary" };
  readonly IO_BO_MANAGE_KEY_COPY: {
    keyType: "primary" | "secondary";
    entryPoint: string;
  };
  readonly IO_BO_SERVICE_KEY_ROTATE: { keyType: "primary" | "secondary" };
  readonly IO_BO_SERVICE_KEY_COPY: { keyType: "primary" | "secondary" };
  readonly IO_BO_SERVICE_DETAILS: { serviceId: string };
  readonly IO_BO_SERVICE_HISTORY: { serviceId: string };
  readonly IO_BO_SERVICE_PREVIEW: { serviceId: string };
  readonly IO_BO_PRODUCT_SWITCH: { productId: string };
  readonly IO_BO_INSTITUTION_SWITCH: { institutionId: string };
};

type MixPanelEvents<
  T extends keyof MixPanelEventsStructure
> = MixPanelEventsStructure[T];

type EmptyObject = Record<string, never>;

type IsEmptyObject<T> = T extends EmptyObject ? true : false;

export const mixpanelSetup = () => {
  mixpanel.init(getConfiguration().BACK_OFFICE_MIXPANEL_TOKEN, {
    debug: true,
    verbose: true,
    track_pageview: false,
    persistence: "localStorage",
    ignore_dnt: true
  });
};

export const logToMixpanel = <T extends keyof MixPanelEventsStructure>(
  operationId: T,
  mixpanelEventData?: IsEmptyObject<MixPanelEvents<T>> extends true
    ? undefined
    : MixPanelEvents<T>
) => {
  let currentEvent: T | undefined;
  let currentEventData: MixPanelEvents<T> | undefined;

  // check to avoid multiple logs
  if (currentEvent !== operationId || currentEventData !== mixpanelEventData) {
    currentEvent = operationId;
    currentEventData = mixpanelEventData;
    mixpanel.track(operationId, mixpanelEventData);
  }
};
