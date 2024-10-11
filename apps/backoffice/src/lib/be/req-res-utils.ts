import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import * as t from "io-ts";
import { NextRequest } from "next/server";

export const getQueryParam = <A>(
  request: NextRequest,
  param: string,
  decoder: t.Decoder<unknown, A>,
  defaultValue?: A,
): t.Validation<A> => {
  const rawParam = request.nextUrl.searchParams.get(param);
  if (defaultValue !== undefined && rawParam === null) {
    return E.right(defaultValue);
  } else {
    return decoder.decode(rawParam);
  }
};

export const parseBody = async <T>(
  request: NextRequest,
  decoder: t.Decoder<unknown, T>,
): Promise<T> => {
  let jsonBody;
  try {
    jsonBody = await request.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("Failed to parse JSON body");
    }
  }
  const maybeServicePayload = decoder.decode(jsonBody);
  if (maybeServicePayload._tag === "Left") {
    throw new Error(readableReport(maybeServicePayload.left));
  }
  return maybeServicePayload.right;
};
