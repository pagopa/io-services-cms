import * as H from "@pagopa/handler-kit";

export const errorToHttpError = (error: Error): H.HttpError =>
  new H.HttpError(`Internal Server Error: ${error.message}`);
