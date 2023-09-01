import { NextRequest, NextResponse } from 'next/server';
import { ResponseError } from '@/generated/api/ResponseError';
import { ServicePayload } from '@/generated/api/ServicePayload'; 

/**
 * @description Create a new Service with the attributes provided in the request payload
 * TODO:!!!!This is a placeholder!!!!
 * FIXME:!!!!Update the implementation!!!!
 */
export async function POST(request: NextRequest) {
  const data = await request.json();
  const bodyParsed = ServicePayload.decode(data);

  if (bodyParsed._tag === "Right") {
    console.log(bodyParsed.right);
  } else {
    const responseError: ResponseError = {
      title: "Bad Request",
      status: 400 as any,
      detail: "An Error Occurred while parsing the request body, request contains an invalid payload",
    };

    return NextResponse.json(responseError, { status: 400 });
  }

  return NextResponse.json({ message: 'Hello World' });
} 

/**
 * @description Retrieve all services owned by the calling user
 * TODO:!!!!This is a placeholder!!!!
 * FIXME:!!!!Update the implementation!!!!
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Hello World' });
}