import { withJWTAuthHandler } from '@/lib/be/wrappers';
import { NextRequest, NextResponse } from 'next/server'; 
import { BackOfficeUser } from '../../../../../types/next-auth';

/**
 * @description Retrieve an institution by ID
 * TODO:!!!!This is a placeholder!!!!
 * FIXME:!!!!Update the implementation!!!!
 */
export const GET = withJWTAuthHandler(
  async (
    request: NextRequest,
    { backofficeUser }: { backofficeUser: BackOfficeUser }
  ) => {
    backofficeUser.id;

    return NextResponse.json({ message: "Hello World" });
  }
);