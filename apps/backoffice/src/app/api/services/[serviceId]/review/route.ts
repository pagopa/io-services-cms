import { NextRequest, NextResponse } from 'next/server';
import { Comment } from '@/generated/api/Comment';
import { ResponseError } from '@/generated/api/ResponseError';
import { ReviewRequest } from '@/generated/api/ReviewRequest'; 

/**
 * @description Send service to review by service ID
 * TODO:!!!!This is a placeholder!!!!
 * FIXME:!!!!Update the implementation!!!!
 */
export async function PUT(request: NextRequest) {
  const data = await request.json();
  const boduParsed = ReviewRequest.decode(data);

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
 * @description Explain service review by service ID
 * TODO:!!!!This is a placeholder!!!!
 * FIXME:!!!!Update the implementation!!!!
 */
export async function PATCH(request: NextRequest) {
  const data = await request.json();
  const boduParsed = Comment.decode(data);

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