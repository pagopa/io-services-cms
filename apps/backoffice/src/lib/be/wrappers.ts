import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import { BackOfficeUser } from "../../../types/next-auth";

export const withJWTAuthHandler =
  (
    handler: (
      nextRequest: NextRequest,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      context: { backofficeUser: BackOfficeUser; params: any },
    ) => Promise<NextResponse> | Promise<Response>,
  ) =>
  async (
    nextRequest: NextRequest,
    { params }: { params: Record<string, unknown> },
  ) => {
    // Metodo di next-auth usato anche all'interno del middleware withAuth
    // Restituisce:
    // - Nel caso di valido e non scaduto token JWT, il payload tipizzato contenuto nello stesso
    // - Nel caso di token scaduto o non valido, null
    const authenticationDetails = await getToken({ req: nextRequest });

    if (!authenticationDetails) {
      return NextResponse.json(
        {
          detail: "No Authentication provided",
          status: 401,
          title: "User Unauthorized",
        },
        { status: 401 },
      );
    }
    // chiamo l'handler finale "iniettando" il payload contenuto nel token
    return handler(nextRequest, {
      backofficeUser: authenticationDetails,
      params,
    });
  };
