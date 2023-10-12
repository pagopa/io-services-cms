import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { BackOfficeUser } from "../../../types/next-auth";

export const withJWTAuthHandler = (
  handler: (
    nextRequest: NextRequest,
    context: { params: any; backofficeUser: BackOfficeUser }
  ) => Promise<NextResponse> | Promise<Response>,
  tokenValidator = getToken
) => async (nextRequest: NextRequest, { params }: { params: {} }) => {
  // Metodo di next-auth usato anche all'interno del middleware withAuth
  // Restituisce:
  // - Nel caso di valido e non scaduto token JWT, il payload tipizzato contenuto nello stesso
  // - Nel caso di token scaduto o non valido, null
  const authenticationDetails = await tokenValidator({ req: nextRequest });

  if (!authenticationDetails) {
    return NextResponse.json(
      {
        detail: "No Authentication provided",
        status: 401,
        title: "User Unauthorized"
      },
      { status: 401 }
    );
  }
  // chiamo l'handler finale "iniettando" il payload contenuto nel token
  return handler(nextRequest, {
    params,
    backofficeUser: authenticationDetails
  });
};
