import { getConfiguration } from "@/config";
import { NextRequest } from "next/server";
import { BackOfficeUser } from "../../../../../types/next-auth";
import { buildApimService } from "@/lib/be/apim-helper";
import { retrieveManageKeys } from "@/lib/be/keys-manage";
import { withJWTAuthHandler } from "@/lib/be/handler-wrappers";

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
