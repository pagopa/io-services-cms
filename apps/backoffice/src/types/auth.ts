/**
 * Authentication & Authorization Types/Interfaces
 */

/** Selfcare roles */
export enum SelfcareRoles {
  admin = "admin",
  operator = "operator",
}

/** List of some useful Azure Apim user groups */
export type UsefulPermissions =
  | "ApiAdmin"
  | "ApiLimitedMessageWrite"
  | "ApiServiceWrite";

export type UserRole = SelfcareRoles | string;

export type UserPermissions = UsefulPermissions[] | string[];

/** Type used to specify `role/permissions` required for **authorization** purpose */
export interface RequiredAuthorizations {
  /** required user permissions to match */
  requiredPermissions?: UserPermissions;
  /** required user role to match */
  requiredRole?: UserRole;
}
