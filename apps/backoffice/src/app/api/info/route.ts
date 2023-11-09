import {
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_OK
} from "@/config/constants";
import { getApimHealth } from "@/lib/be/apim-service";
import { getAzureAccessTokenHealth } from "@/lib/be/azure-access-token";
import { getIoServicesCmsHealth } from "@/lib/be/cms-client";
import { getCosmosStoreHealth } from "@/lib/be/cosmos-store";
import healthcheck from "@/lib/be/healthcheck";
import { getLegacyCosmosHealth } from "@/lib/be/legacy-cosmos";
import { getSelfcareHealth } from "@/lib/be/selfcare-client";
import { getSubscriptionsMigrationHealth } from "@/lib/be/subscription-migration-client";
import { NextResponse } from "next/server";
import packageJson from "../../../../package.json";

export const dynamic = "force-dynamic";

/**
 * `api/info` route handler
 * @returns project _name_ and _version_
 */
export async function GET() {
  // get info from package.json

  const health = await healthcheck([
    getLegacyCosmosHealth(),
    getApimHealth(),
    getSelfcareHealth(),
    getIoServicesCmsHealth(),
    getAzureAccessTokenHealth(),
    getCosmosStoreHealth(),
    getSubscriptionsMigrationHealth()
  ]);
  const status =
    health.status === "ok" ? HTTP_STATUS_OK : HTTP_STATUS_INTERNAL_SERVER_ERROR;

  const response = {
    name: packageJson.name,
    version: packageJson.version,
    health
  };

  return NextResponse.json(response, { status });
}
