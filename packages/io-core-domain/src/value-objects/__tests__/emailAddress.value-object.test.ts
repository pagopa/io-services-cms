import { describe, expect, it } from "vitest";

import { EmailAddressSchema } from "../emailAddress.value-object.js";

describe("EmailAddressSchema", () => {
  it("should accept a valid email address", () => {
    const result = EmailAddressSchema.safeParse("user@example.com");

    expect(result).toEqual({ data: "user@example.com", success: true });
  });

  it("should lowercase the email", () => {
    const result = EmailAddressSchema.safeParse("User@EXAMPLE.COM");
    expect(result).toEqual({ data: "user@example.com", success: true });
  });

  it("should reject an email without @", () => {
    const result = EmailAddressSchema.safeParse("invalid-email");
    expect(result.success).toBe(false);
  });

  it("should reject an email without domain", () => {
    const result = EmailAddressSchema.safeParse("user@");
    expect(result.success).toBe(false);
  });

  it("should reject an empty string", () => {
    const result = EmailAddressSchema.safeParse("");
    expect(result.success).toBe(false);
  });

  it("should reject an email with spaces", () => {
    const result = EmailAddressSchema.safeParse("user @example.com");
    expect(result.success).toBe(false);
  });
});
