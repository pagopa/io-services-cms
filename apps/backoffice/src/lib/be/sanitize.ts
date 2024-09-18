/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import xss from "xss";

export const sanitizeObject = (obj: any): any => {
  if (typeof obj === "string") {
    return xss(obj);
  } else if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  } else if (typeof obj === "object" && obj !== null) {
    const sanitizedObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitizedObj[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitizedObj;
  } else {
    return obj;
  }
};

export const sanitizedNextResponseJson = (obj: any, status = 200) =>
  NextResponse.json(sanitizeObject(obj), { status });
