import { NextRequest } from "next/server";

/**
 * @description Regenerate Manage key by service ID and key type
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { keyType: string } }
) {
  throw new Error("Not implemented");
}
