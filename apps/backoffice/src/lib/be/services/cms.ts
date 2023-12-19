import { ServiceTopicList } from "@/generated/services-cms/ServiceTopicList";
import { getIoServicesCmsClient } from "@/lib/be/cms-client";

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

// This is temporany, it will be removed when the getServiceTopics API will be implemented in io-services-cms
export const getServiceTopics = async (): Promise<ServiceTopicList> => ({
  topics: [
    {
      id: 0,
      name: "Altro"
    },
    {
      id: 1,
      name: "Ambiente e animali"
    },
    {
      id: 2,
      name: "Attività produttive e commercio"
    },
    {
      id: 3,
      name: "Benessere sociale"
    },
    {
      id: 4,
      name: "Casa e utenze"
    },
    {
      id: 5,
      name: "Cultura, tempo libero e sport"
    },
    {
      id: 6,
      name: "Educazione e formazione"
    },
    {
      id: 7,
      name: "Giustizia e legge"
    },
    {
      id: 8,
      name: "Lavori edilizi, catasto e urbanistica"
    },
    {
      id: 9,
      name: "Mobilità e trasporti"
    },
    {
      id: 10,
      name: "Redditi, patrimoni e fisco"
    },
    {
      id: 17,
      name: "Salute"
    },
    {
      id: 11,
      name: "Servizi anagrafici e civici"
    },
    {
      id: 12,
      name: "Servizi elettorali"
    },
    {
      id: 13,
      name: "Sicurezza e Protezione Civile"
    },
    {
      id: 14,
      name: "Suolo, spazi e beni pubblici"
    },
    {
      id: 15,
      name: "Viaggi e turismo"
    },
    {
      id: 16,
      name: "Vita lavorativa"
    }
  ]
});
