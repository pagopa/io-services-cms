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
