import { NextRequest, NextResponse } from 'next/server';
import { ResponseError } from '@/generated/api/ResponseError';
import { SelfCareIdentity } from '@/generated/api/SelfCareIdentity'; 

/**
 * @description Resolve selfcare identity
 * TODO:!!!!This is a placeholder!!!!
 * FIXME:!!!!Update the implementation!!!!
 */
export async function POST(request: NextRequest) {
  const data = await request.json();
  const boduParsed = SelfCareIdentity.decode(data);

  if (boduParsed._tag === "Right") {
    console.log(boduParsed.right);
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