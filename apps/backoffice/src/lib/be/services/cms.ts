import { getIoServicesCmsClient, getTopicsProvider } from "@/lib/be/cms-client";

export type IoServicesCmsClient = ReturnType<typeof getIoServicesCmsClient>;

/**
 * method to call io-services-cms API
 * @param clientId the client to use
 * @param operationId openapi operationId
 * @param requestParams request parameters _(as specified in openapi)_
 * @returns the response or an error
 */
export const callIoServicesCms = async <
  T extends keyof ReturnType<typeof getIoServicesCmsClient>
>(
  operationId: T,
  requestPayload: any
) => await getIoServicesCmsClient()[operationId](requestPayload);

export const getServiceTopics = (xForwardedFor: string | undefined) => {
  return getTopicsProvider().getServiceTopics(xForwardedFor);
};
