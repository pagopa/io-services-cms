import {
  HttpStatusCodeEnum,
  IResponse,
} from "@pagopa/ts-commons/lib/responses";

/**
 * Interface for a successful response returning a json object.
 */
export interface IResponseJsonWithStatusJson<T>
  extends IResponse<"IResponseJsonWithStatusJson"> {
  readonly value: T; // needed to discriminate from other T subtypes
}

/**
 * Returns a successful json response.
 *
 * @param o The object to return to the client
 */
export const ResponseJsonWithStatusJson = <T>(
  o: T,
  statusCode: HttpStatusCodeEnum
): IResponseJsonWithStatusJson<T> => {
  const kindlessObject = Object.assign(Object.assign({}, o), {
    kind: undefined,
  });
  return {
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    apply: (res) => res.status(statusCode).json(kindlessObject),
    kind: "IResponseJsonWithStatusJson",
    value: o,
  };
};
