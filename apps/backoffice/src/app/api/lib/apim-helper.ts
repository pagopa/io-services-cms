import { getConfiguration } from "@/config";
import { ApimUtils } from "@io-services-cms/external-clients";

export const buildApimService = (
  configuration: ReturnType<typeof getConfiguration>
) => {
  // client to interact with Api Management
  const apimClient = ApimUtils.getApimClient(
    configuration.azureClientSecretCredential,
    configuration.AZURE_SUBSCRIPTION_ID
  );

  // Apim Service, used to operates on Apim resources
  const apimService = ApimUtils.getApimService(
    apimClient,
    configuration.AZURE_APIM_RESOURCE_GROUP,
    configuration.AZURE_APIM
  );
  return apimService;
};
