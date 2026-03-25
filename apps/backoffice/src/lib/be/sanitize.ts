import { NextResponse } from "next/server";
import xss from "xss";

export const sanitizeObject = <T>(obj: T): T => {
  if (typeof obj === "string") {
    return xss(obj) as T;
  } else if (Array.isArray(obj)) {
    return obj.map(sanitizeObject) as T;
  } else if (typeof obj === "object" && obj !== null) {
    const sanitizedObj = {} as T;
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

export const sanitizedNextResponseJson = <T>(
  obj: T,
  status = 200,
): NextResponse<T> => NextResponse.json(sanitizeObject(obj), { status });
