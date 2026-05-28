import {
  type BackOfficeUser,
  type BackOfficeUserParameters,
  type BackOfficeUserPermissions,
  type Institution,
} from "../../../types/next-auth";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

const isInstitution = (value: unknown): value is Institution => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.fiscalCode === "string" &&
    typeof value.id === "string" &&
    typeof value.isAggregate === "boolean" &&
    typeof value.isAggregator === "boolean" &&
    (value.logo_url === undefined || typeof value.logo_url === "string") &&
    typeof value.name === "string" &&
    typeof value.role === "string"
  );
};

const isBackOfficeUserPermissions = (
  value: unknown,
): value is BackOfficeUserPermissions => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isStringArray(value.apimGroups) &&
    (value.selcGroups === undefined || isStringArray(value.selcGroups))
  );
};

const isBackOfficeUserParameters = (
  value: unknown,
): value is BackOfficeUserParameters => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.subscriptionId === "string" &&
    typeof value.userEmail === "string" &&
    typeof value.userId === "string"
  );
};

export const isBackOfficeUserToken = (
  value: unknown,
): value is BackOfficeUser => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    isInstitution(value.institution) &&
    isBackOfficeUserPermissions(value.permissions) &&
    isBackOfficeUserParameters(value.parameters)
  );
};
