import { NextRequest, NextResponse } from 'next/server';
import { Logo } from '@/generated/api/Logo';
import { ResponseError } from '@/generated/api/ResponseError'; 

/**
 * @description Upload service logo by service ID
 * TODO:!!!!This is a placeholder!!!!
 * FIXME:!!!!Update the implementation!!!!
 */
export async function PUT(request: NextRequest) {
  const data = await request.json();
  const bodyParsed = Logo.decode(data);

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