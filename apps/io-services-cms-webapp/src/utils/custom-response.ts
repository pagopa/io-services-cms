import {
  HttpStatusCodeEnum,
  IResponse,
} from "@pagopa/ts-commons/lib/responses";

/**
 * Interface for response returning a json object.
 */
export interface IResponseJsonWithStatus<T>
  extends IResponse<"IResponseJsonWithStatus"> {
  readonly value: T; // needed to discriminate from other T subtypes
}

/**
 * Returns a json response with the specified response statusCode.
 *
 * @param o The object to return to the client
 * @param statusCode The response status code
 */
export const ResponseJsonWithStatus = <T>(
  o: T,
  statusCode: HttpStatusCodeEnum,
): IResponseJsonWithStatus<T> => {
  const kindlessObject = Object.assign(Object.assign({}, o), {
    kind: undefined,
  });
  return {
    apply: (res) => res.status(statusCode).json(kindlessObject),
    kind: "IResponseJsonWithStatus",
    value: o,
  };
};
