import { getConfiguration } from "@/config";
import { buildHandlers as apimHandlers } from "./apim-handlers";
import { buildHandlers as backendHandlers } from "./backend-handlers";
import { buildHandlers as cdnHandlers } from "./cdn-handlers";
import { buildHandlers as cosmosLegacyHandlers } from "./cosmos-legacy-handlers";
import { buildHandlers as selfcareHandlers } from "./selfcare-handlers";
import { buildHandlers as servicesCmsHandlers } from "./services-cms-handlers";
import { buildHandlers as subscriptionsMigrationHandlers } from "./subscription-migration-handler";

/** List of handlers managed by MSW */
export const getHandlers = () => {
  const config = getConfiguration();
  const handlers = cdnHandlers();
  if (config.API_BACKEND_MOCKING) {
    handlers.push(...backendHandlers());
  }
  if (config.API_SERVICES_CMS_MOCKING) {
    handlers.push(...servicesCmsHandlers());
  }
  if (config.SELFCARE_API_MOCKING) {
    handlers.push(...selfcareHandlers());
  }
  if (config.API_APIM_MOCKING) {
    handlers.push(...apimHandlers());
  }
  if (config.SUBSCRIPTION_MIGRATION_API_MOCKING) {
    handlers.push(...subscriptionsMigrationHandlers());
  }
  if (config.LEGACY_COSMOSDB_MOCKING) {
    handlers.push(...cosmosLegacyHandlers());
  }
  return handlers;
};
