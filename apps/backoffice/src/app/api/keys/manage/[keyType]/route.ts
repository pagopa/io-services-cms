import { buildApimService } from "@/app/api/lib/apim-helper";
import { withJWTAuthHandler } from "@/app/api/lib/handler-wrappers";
import { regenerateManageKeys } from "@/app/api/lib/keys-manage";
import { getConfiguration } from "@/config";
import { NextRequest } from "next/server";
import { BackOfficeUser } from "../../../../../../types/next-auth";

/**
 * @description Regenerate Manage key by key type
 */
const handler = (
  request: NextRequest,
  {
    params,
    backofficeUser
  }: { params: { keyType: string }; backofficeUser: BackOfficeUser }
) => {
  const config = getConfiguration();

  // Apim Service, used to operates on Apim resources
  const apimService = buildApimService(config);

  return regenerateManageKeys(apimService)(backofficeUser, params.keyType)();
};

export const { PUT = withJWTAuthHandler(handler) } = {};
