import {
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_OK
} from "@/config/constants";
import { getApimHealth } from "@/lib/be/apim-service";
import healthcheck from "@/lib/be/healthcheck";
import { getLegacyCosmosHealth } from "@/lib/be/legacy-cosmos";
import { NextResponse } from "next/server";
import packageJson from "../../../../package.json";
import { getSelfcareHealth } from "@/lib/be/selfcare-client";
import { getIoServicesCmsHealth } from "@/lib/be/cms-client";
import { getAzureAccessTokenHealth } from "@/lib/be/azure-access-token";

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
    getAzureAccessTokenHealth()
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
