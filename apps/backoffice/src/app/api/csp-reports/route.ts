import { NextRequest, NextResponse } from "next/server";
import * as ai from "applicationinsights";

export async function POST(
  nextRequest: NextRequest,
  nextResponse: NextResponse
) {
  const jsonBody = await nextRequest.json();

  ai.defaultClient.trackException({
    exception: new Error(JSON.stringify(jsonBody)),
    severity: ai.Contracts.SeverityLevel.Warning
  });

  return new Response("Success!", {
    status: 200
  });
}
