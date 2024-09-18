import mixpanel from "mixpanel-browser";

type MixPanelEventsStructure = {
  readonly IO_BO_LOGIN: {};
  readonly IO_BO_OVERVIEW_PAGE: {};
  readonly IO_BO_SERVICES_PAGE: {};
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

type OperationId<Event extends MixPanelEventsStructure> = {
  eventKey: Extract<keyof Event, string>;
};

const logToMixpanel = <T extends keyof MixPanelEventsStructure>(
  operationId: T,
  mixpanelEventData: MixPanelEvents<T>
) => {
  let currentEvent;
  let currentEventData = {};

  // check to avoid multiple logs
  if (currentEvent != operationId || currentEventData != mixpanelEventData) {
    currentEvent = operationId;
    currentEventData = mixpanelEventData;
    mixpanel.track(operationId, mixpanelEventData);
  }
};

export default logToMixpanel;
