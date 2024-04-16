/* eslint-disable @typescript-eslint/no-empty-function */
import * as H from "@pagopa/handler-kit";
import * as L from "@pagopa/logger";
export const httpHandlerInputMocks: H.HandlerEnvironment<H.HttpRequest> = {
  input: H.request("mockurl"),
  inputDecoder: H.HttpRequest,
  logger: {
    log: () => () => {},
    format: L.format.simple,
  },
};
