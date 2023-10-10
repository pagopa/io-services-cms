import { HTTP_STATUS_OK } from "@/config/constants";

export type ResponseContent<T> = {
  httpStatus: number;
  body: T;
};

export const buildResponseContent = <T>(
  body: T,
  httpStatus = HTTP_STATUS_OK
): ResponseContent<T> => ({
  httpStatus,
  body
});
