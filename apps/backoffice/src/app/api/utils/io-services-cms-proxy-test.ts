import {
  API_SERVICES_CMS_BASE_PATH,
  API_SERVICES_CMS_MOCKING,
  API_SERVICES_CMS_URL
} from "@/config/constants";
import { ResponseError } from "@/generated/services-cms/ResponseError";
import { Client, createClient } from "@/generated/services-cms/client";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/lib/Option";
import { cons } from "fp-ts/lib/ReadonlyNonEmptyArray";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";
import { NextRequest, NextResponse } from "next/server";
import { json } from "stream/consumers";

if (API_SERVICES_CMS_MOCKING) {
  const { setupMocks } = require("../../../../mocks");
  setupMocks();
}

// io-services-cms client
const ioServicesCmsClient: Client = createClient({
  baseUrl: API_SERVICES_CMS_URL,
  fetchApi: (fetch as any) as typeof fetch,
  basePath: API_SERVICES_CMS_BASE_PATH
});

/** List of all client operations */
type ClientOperations = typeof ioServicesCmsClient;

/** Extract operation request parameters inferred by client operationId */
type ExtractRequestParams<T extends keyof ClientOperations> = Parameters<
  ClientOperations[T]
>[0];

type PathParameters = {
  serviceId: string;
  keyType?: string;
};
type RequestSpec = {
  operationId: keyof ClientOperations;
  requestCodec?: t.Mixed;
  responseCodec?: t.Mixed;
  pathParams?: PathParameters;
};

type RequestMethods = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

const requestrSpecMap: {
  [key: string]: (matches: RegExpMatchArray | null) => RequestSpec;
} = {
  "POST-/services": () => ({ operationId: "createService" }),
  "GET-/services": () => ({ operationId: "getServices" }),
  "GET-/services/([^/]+)": matches => ({
    operationId: "getService",
    pathParams: { serviceId: matches ? matches[1] : "" }
  }),
  "PUT-/services/([^/]+)": matches => ({
    operationId: "updateService",
    pathParams: { serviceId: matches ? matches[1] : "" }
  }),
  "DELETE-/services/([^/]+)": matches => ({
    operationId: "deleteService",
    pathParams: { serviceId: matches ? matches[1] : "" }
  }),
  "PUT-/services/([^/]+)/logo": matches => ({
    operationId: "updateServiceLogo",
    pathParams: { serviceId: matches ? matches[1] : "" }
  }),
  "GET-/services/([^/]+)/keys": matches => ({
    operationId: "getServiceKeys",
    pathParams: { serviceId: matches ? matches[1] : "" }
  }),
  "PUT-/services/([^/]+)/keys/([^/]+)": matches => ({
    operationId: "regenerateServiceKey",
    pathParams: {
      serviceId: matches ? matches[1] : "",
      keyType: matches ? matches[2] : ""
    }
  }),
  "PUT-/services/([^/]+)/review": matches => ({
    operationId: "reviewService",
    pathParams: { serviceId: matches ? matches[1] : "" }
  }),
  "PATCH-/services/([^/]+)/review": matches => ({
    operationId: "explainService",
    pathParams: { serviceId: matches ? matches[1] : "" }
  }),
  "POST-/services/([^/]+)/release": matches => ({
    operationId: "releaseService",
    pathParams: { serviceId: matches ? matches[1] : "" }
  }),
  "GET-/services/([^/]+)/release": matches => ({
    operationId: "getPublishedService",
    pathParams: { serviceId: matches ? matches[1] : "" }
  }),
  "DELETE-/services/([^/]+)/release": matches => ({
    operationId: "unpublishService",
    pathParams: { serviceId: matches ? matches[1] : "" }
  })
};

const getRequestSpec = (
  requestKey: string
): E.Either<ResponseError, RequestSpec> => {
  for (const [pattern, creatorFunction] of Object.entries(requestrSpecMap)) {
    const regex = new RegExp(`^${pattern}$`);
    const matches = requestKey.match(regex);
    if (matches) {
      return E.right(creatorFunction(matches));
    }
  }
  return E.left({
    title: "Bad Request",
    status: 400 as any,
    detail: "Invalid path"
  });
};

const extractPath = (input: string): E.Either<ResponseError, string> => {
  const match = input.match(/(\/services.*)/);
  return match
    ? E.right(match[1])
    : E.left({
        title: "Bad Request",
        status: 400 as any,
        detail: "Invalid path"
      });
};

const validateRequestBody = (
  json: any,
  requestCodec?: t.Mixed
): E.Either<ResponseError, any> => {
  return pipe(
    requestCodec,
    O.fromNullable,
    O.foldW(
      () => E.right(json),
      codec =>
        pipe(
          codec.decode(json),
          E.foldW(
            error => {
              console.log("request fail validation: ", json);
              return E.left({
                title: "validationError",
                status: 400 as any,
                detail: readableReport(error)
              });
            },
            request => E.right(request)
          )
        )
    )
  );
};

const extractRequestBody = (
  request: NextRequest
): TE.TaskEither<Error, any> => {
  if (request.body) {
    return TE.tryCatch(
      () => request.json(),
      error => new Error(String(error))
    );
  } else {
    return TE.right({});
  }
};

// request forwarder
export const ioServicesCmsRequestForwarder = async (
  httpMethod: RequestMethods,
  request: NextRequest
) =>
  pipe(
    extractPath(request.nextUrl.pathname),
    x => {
      console.log("extractPath: ", x);
      return x;
    },
    E.chainW(path => getRequestSpec(`${httpMethod}-${path}`)),
    E.map(requestSpec => {
      console.log("getRequestSpec: ", requestSpec);
      return requestSpec;
    }),
    TE.fromEither,
    TE.chainW(({ operationId, requestCodec, pathParams }) =>
      pipe(
        extractRequestBody(request),
        TE.chainW(json =>
          pipe(validateRequestBody(json, requestCodec), TE.fromEither)
        ),
        TE.chainW(json =>
          TE.tryCatch(
            () =>
              callIoServicesCmsV2(
                operationId,
                buildRequestPayload(json, pathParams),
                requestCodec
              ),
            _ => {
              console.log("callIoServicesCms error: ", _);
              return {
                title: "Internal Server Error",
                status: 500 as any,
                detail: "Generic Error executing request"
              } as ResponseError;
            }
          )
        ),
        x => x
      )
    ),
    TE.mapLeft(responseError =>
      NextResponse.json({ ...responseError }, { status: 400 })
    ),
    TE.toUnion
  )();

/**
 * method to call io-services-cms API
 *
 * @param operationId openapi operationId
 * @param requestParams request parameters _(as specified in openapi)_
 * @returns the response or an error
 * // TODO: jwt token handing
 */
export const callIoServicesCmsV2 = async <T extends keyof ClientOperations>(
  operationId: T,
  requestPayload: any,
  responseCodec?: t.Mixed
) => {
  const result = await ioServicesCmsClient[operationId](requestPayload);

  if (E.isLeft(result)) {
    console.log("ioServicesCmsApiCall error: ", JSON.stringify(result.left));
    return NextResponse.json(
      {
        title: "validationError",
        status: 400 as any,
        detail: readableReport(result.left)
      },
      { status: 400 }
    );
  }

  // NextResponse.json() does not support 204 status code https://github.com/vercel/next.js/discussions/51475
  if (result.right.status === 204) {
    return new Response(null, {
      status: 204
    });
  }

  return pipe(
    responseCodec,
    O.fromNullable,
    O.foldW(
      () => result.right.value,
      validateIoServicesCmsResponse(result.right.value)
    ),
    responseBody =>
      NextResponse.json(responseBody, { status: result.right.status })
  );
};

/**
 * method to call io-services-cms API
 *
 * @param operationId openapi operationId
 * @param requestParams request parameters _(as specified in openapi)_
 * @returns the response or an error
 * // TODO: jwt token handing
 */
export const callIoServicesCms = async <T extends keyof ClientOperations>(
  operationId: T,
  requestParams?: any,
  responseCodec?: t.Mixed
) => {
  const requestPayload = {
    ...requestParams,
    "x-user-email": "SET_RETRIEVED_USER_EMAIL_HERE", // TODO: replace with real value
    "x-user-groups": "SET_RETRIEVED_USER_GROUPS_HERE", // TODO: replace with real value
    "x-user-id": "SET_RETRIEVED_USER_ID_HERE", // TODO: replace with real value
    "x-subscription-id": "SET_RETRIEVED_SUBSCRIPTION_ID_HERE" // TODO: replace with real value
  };
  const result = await ioServicesCmsClient[operationId](requestPayload);

  if (E.isLeft(result)) {
    console.log("ioServicesCmsApiCall error: ", JSON.stringify(result.left));
    return NextResponse.json(
      {
        title: "validationError",
        status: 400 as any,
        detail: readableReport(result.left)
      },
      { status: 400 }
    );
  }

  // NextResponse.json() does not support 204 status code https://github.com/vercel/next.js/discussions/51475
  if (result.right.status === 204) {
    return new Response(null, {
      status: 204
    });
  }

  return pipe(
    responseCodec,
    O.fromNullable,
    O.foldW(
      () => result.right.value,
      validateIoServicesCmsResponse(result.right.value)
    ),
    responseBody =>
      NextResponse.json(responseBody, { status: result.right.status })
  );
};

const validateIoServicesCmsResponse = (response: unknown) => (
  responseCodec: t.Mixed
) =>
  pipe(
    responseCodec.decode(response),
    E.foldW(
      error => {
        console.log("response fail validation: ", response);
        return {
          title: "validationError",
          status: 400 as any,
          detail: readableReport(error)
        };
      },
      response => response
    )
  );
const buildRequestPayload = (
  json: any,
  pathParams: PathParameters | undefined
): any => {
  return {
    ...pathParams,
    body: json,
    "x-user-email": "SET_RETRIEVED_USER_EMAIL_HERE", // TODO: replace with real value
    "x-user-groups": "SET_RETRIEVED_USER_GROUPS_HERE", // TODO: replace with real value
    "x-user-id": "SET_RETRIEVED_USER_ID_HERE", // TODO: replace with real value
    "x-subscription-id": "SET_RETRIEVED_SUBSCRIPTION_ID_HERE" // TODO: replace with real value
  };
};
