import { getConfiguration } from "@/config";
import { Client, createClient } from "@/generated/api/client";
import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as t from "io-ts";

import { fetchWithUpperCaseHttpMethod } from "./wrapper-fetch";

export interface BffApiClient {
  fetchData: <T extends keyof ClientOperations, RC>(
    operationId: T,
    requestParams: ExtractRequestParams<T>,
    responseCodec: t.Type<RC>,
  ) => Promise<E.Either<BffApiClientError, RC>>;
}

export interface BffApiClientError extends Error {
  status?: number;
}

let client: Client;
let bffApiClient: BffApiClient;

/** List of all client operations */
type ClientOperations = typeof client;

/** Extract operation request parameters inferred by client operationId */
type ExtractRequestParams<T extends keyof ClientOperations> = Parameters<
  ClientOperations[T]
>[0];

const getClientInstance = (): Client => {
  if (!client) {
    client = buildClientInstance();
  }
  return client;
};

const buildClientInstance = (): Client =>
  createClient({
    baseUrl: getConfiguration().API_BACKEND_BASE_URL,
    fetchApi: fetchWithUpperCaseHttpMethod(),
  });

const buildBffApiClient = (): BffApiClient => {
  const clientInstance: Client = getClientInstance();

  const fetchData = async <T extends keyof ClientOperations, RC>(
    operationId: T,
    requestParams: ExtractRequestParams<T>,
    responseCodec: t.Type<RC>,
  ) => {
    try {
      const result = await clientInstance[operationId]({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(requestParams as any),
      });

      if (E.isLeft(result)) {
        return E.left(new Error(readableReport(result.left)));
      } else {
        // Get client http response
        const response = result.right;

        if (response.status >= 200 && response.status <= 299) {
          return pipe(
            responseCodec.decode(response.value),
            E.fold(
              (e) => E.left(new Error(readableReport(e))),
              (value) => E.right(value),
            ),
          );
        }
        return E.left({
          message: "BffApiClientHttpError",
          status: response.status,
        } as BffApiClientError);
      }
    } catch (err) {
      return E.left(err as Error);
    }
  };

  return {
    fetchData,
  };
};

export const getBffApiClient = (): BffApiClient => {
  if (!bffApiClient) {
    bffApiClient = buildBffApiClient();
  }
  return bffApiClient;
};
