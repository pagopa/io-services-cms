import { getUserDetails } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import packageJson from "../../../../package.json";

/**
 * `api/info` route handler
 * @returns project _name_ and _version_
 */
export async function GET(req: NextRequest) {
  const userDetails = getUserDetails(req); //TODO: remove
  console.log("userDetails", userDetails); //TODO: remove
  const info = {
    name: packageJson.name,
    version: packageJson.version
  };
  return NextResponse.json({ info });
}
