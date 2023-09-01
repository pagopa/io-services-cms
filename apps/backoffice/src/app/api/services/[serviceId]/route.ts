import { NextRequest, NextResponse } from 'next/server';
import { ResponseError } from '@/generated/api/ResponseError';
import { ServicePayload } from '@/generated/api/ServicePayload'; 

/**
 * @description Retrieve a service by ID
 * TODO:!!!!This is a placeholder!!!!
 * FIXME:!!!!Update the implementation!!!!
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Hello World' });
} 

/**
 * @description Update an existing service by ID
 * TODO:!!!!This is a placeholder!!!!
 * FIXME:!!!!Update the implementation!!!!
 */
export async function PUT(request: NextRequest) {
  const data = await request.json();
  const boduParsed = ServicePayload.decode(data);

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

/**
 * @description Delete a service by ID
 * TODO:!!!!This is a placeholder!!!!
 * FIXME:!!!!Update the implementation!!!!
 */
export async function DELETE(request: NextRequest) {
  return NextResponse.json({ message: 'Hello World' });
}