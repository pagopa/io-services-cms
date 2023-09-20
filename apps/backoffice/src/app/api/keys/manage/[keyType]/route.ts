import { NextRequest, NextResponse } from "next/server";

/**
 * @description Regenerate Manage key by service ID and key type
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { keyType: string } }
) {
  return NextResponse.json({ message: "Not Implemented" });
}
