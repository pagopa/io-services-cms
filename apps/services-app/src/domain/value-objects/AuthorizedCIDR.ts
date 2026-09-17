import * as z from "zod";

export const AuthorizedCIDR = Symbol("AuthorizedCIDR");

const AuthorizedCIDRRegex =
  /^([0-9]{1,3}[.]){3}[0-9]{1,3}(\/([0-9]|[1-2][0-9]|3[0-2]))?$/;

export const AuthorizedCIDRSchema = z
  .string()
  .regex(AuthorizedCIDRRegex, "Invalid Authorized CIDR format")
  .brand(AuthorizedCIDR);

export type AuthorizedCIDR = z.infer<typeof AuthorizedCIDRSchema>;
