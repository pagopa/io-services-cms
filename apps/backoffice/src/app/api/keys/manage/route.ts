import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUser } from "../../../../../types/next-auth";
import { ApimUtils } from "@io-services-cms/external-clients";
import { getConfiguration } from "@/config";
import { retrieveManageKeys } from "../../lib/keys-manage";
import { withJWTAuthHandler } from "../../lib/handler-wrappers";
import { pipe } from "fp-ts/lib/function";
import { buildApimService } from "../../lib/apim-helper";

/**
 * @description Retrieve Manage keys
 *
 */
const handler = (
  request: NextRequest,
  { backofficeUser }: { backofficeUser: BackOfficeUser }
) => {
  const config = getConfiguration();

  // Apim Service, used to operates on Apim resources
  const apimService = buildApimService(config);

  return retrieveManageKeys(apimService)(backofficeUser)();
};

export const { GET = withJWTAuthHandler(handler) } = {};
