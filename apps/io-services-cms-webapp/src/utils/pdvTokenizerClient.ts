import { Client, createClient } from "../generated/pdv-tokenizer-api/client";

export const pdvTokenizerClient = (
  baseUrl: string,
  token: string,
  fetchApi: typeof fetch = fetch as unknown as typeof fetch,
  basePath: string,
): Client<"api_key"> =>
  createClient<"api_key">({
    basePath,
    baseUrl,
    fetchApi,
    withDefaults:
      (
        // NOTE: cast to any necessary because the codegen does not aggregate well all request types,
        // requiring a mandatory body in all requests in this case(please refer to issue #329)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        op: any,
        // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
      ) =>
      (params) =>
        op({
          ...params,
          // please refer to source api spec for actual header mapping
          api_key: token,
        }),
  });

export type PdvTokenizerClient = ReturnType<typeof pdvTokenizerClient>;
