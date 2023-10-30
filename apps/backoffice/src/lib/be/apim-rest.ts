import {
  ErrorResponse,
  SubscriptionCollection
} from "@azure/arm-apimanagement";
import { AzureAuthorityHosts, ClientSecretCredential } from "@azure/identity";
import axios from "axios";

export const testUserSubcriptionListWithTotalCount = async () => {
  const credential = new ClientSecretCredential(
    "inserire valore reale tenantId",
    "inserire valore reale clientId",
    "inserire valore reale clientSecret",
    {
      authorityHost: AzureAuthorityHosts.AzurePublicCloud
    }
  );
  const tokenResponse = await credential.getToken(
    "https://management.azure.com/.default"
  );

  const accessToken = tokenResponse?.token || null;
  const subscriptionId = "ec285037-c673-4f58-b594-d7c480da4e8b"; // PROD-IO
  const resourceGroupName = "io-p-rg-internal";
  const serviceName = "io-p-apim-v2-api";
  const userId = "01GJMF341BZQBP71Q39S1EHBH6"; // id utente apim giuseppe di pinto
  const skip = 0; // offset
  const top = 20; // limit

  if (accessToken) {
    const subscriptionListUrl = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.ApiManagement/service/${serviceName}/users/${userId}/subscriptions?api-version=2022-08-01&%24skip=${skip}&%24top=${top}`;

    const { data, status } = await axios.get<
      SubscriptionCollection | ErrorResponse
    >(subscriptionListUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    return { data, status };
  } else {
    console.error("invalid or null accessToken");
  }
};
