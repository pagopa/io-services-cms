import { NextResponse } from "next/server";
import packageJson from "../../../../package.json";

/**
 * `api/info` route handler
 * @returns project _name_ and _version_
 */
export async function GET() {
  const info = {
    name: packageJson.name,
    version: packageJson.version
  };
  return NextResponse.json({ info });
}
