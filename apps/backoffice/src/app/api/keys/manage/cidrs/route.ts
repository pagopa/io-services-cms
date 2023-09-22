import { NextRequest, NextResponse } from "next/server";

/**
 * @description Retrieve manage key authorized CIDRs
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { keyType: string } }
) {
  return NextResponse.json({ message: "Not Implemented" });
}

/**
 * @description Update manage key authorized CIDRs
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { keyType: string } }
) {
  return NextResponse.json({ message: "Not Implemented" });
}
