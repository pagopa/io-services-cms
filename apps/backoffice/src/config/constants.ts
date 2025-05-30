import { ResponseError } from "@/generated/api/ResponseError";

//HTTP STATUSES
export const HTTP_STATUS_OK = 200 as Exclude<
  ResponseError["status"],
  undefined
>;
export const HTTP_STATUS_CREATED = 201 as Exclude<
  ResponseError["status"],
  undefined
>;
export const HTTP_STATUS_ACCEPTED = 202 as Exclude<
  ResponseError["status"],
  undefined
>;
export const HTTP_STATUS_NO_CONTENT = 204 as Exclude<
  ResponseError["status"],
  undefined
>;
export const HTTP_STATUS_BAD_REQUEST = 400 as Exclude<
  ResponseError["status"],
  undefined
>;
export const HTTP_STATUS_UNAUTHORIZED = 401 as Exclude<
  ResponseError["status"],
  undefined
>;
export const HTTP_STATUS_FORBIDDEN = 403 as Exclude<
  ResponseError["status"],
  undefined
>;
export const HTTP_STATUS_NOT_FOUND = 404 as Exclude<
  ResponseError["status"],
  undefined
>;
export const HTTP_STATUS_PRECONDITION_FAILED = 412 as Exclude<
  ResponseError["status"],
  undefined
>;
export const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500 as Exclude<
  ResponseError["status"],
  undefined
>;
export const HTTP_STATUS_SERVICE_UNAVAILABLE = 503 as Exclude<
  ResponseError["status"],
  undefined
>;
export const HTTP_STATUS_GATEWAY_TIMEOUT = 504 as Exclude<
  ResponseError["status"],
  undefined
>;
export const HTTP_TITLE_BAD_REQUEST = "Bad Request";
export const HTTP_TITLE_UNAUTHORIZED = "Unauthorized";
export const HTTP_TITLE_FORBIDDEN = "Forbidden";

export const TEST_INSTITUTION_ID = "141b402b-79e7-4d39-a729-5f31bf5c1a77";
