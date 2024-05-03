/* eslint-disable @typescript-eslint/dot-notation */
import { Container } from "@azure/cosmos";
import { ServiceDetail as CosmosDbServiceDetails } from "@io-services-cms/models";
import {
  NonEmptyString,
  OrganizationFiscalCode,
} from "@pagopa/ts-commons/lib/strings";
import { vi } from "vitest";
import { NotificationChannelEnum } from "../../generated/definitions/internal/NotificationChannel";
import { ServiceDetails as ApiResponseServiceDetails } from "../../generated/definitions/internal/ServiceDetails";
import {
  CategoryEnum,
  ScopeEnum,
} from "../../generated/definitions/internal/ServiceMetadata";

export const buildCosmosDbServiceDetails = (
  require_secure_channel: boolean
): CosmosDbServiceDetails => ({
  id: "aServiceId" as NonEmptyString,
  name: "aServiceName" as NonEmptyString,
  cms_last_update_ts: 1,
  description: "aServiceDescription" as NonEmptyString,
  organization: {
    name: "aServiceOrganization" as NonEmptyString,
    fiscal_code: "01234567890" as OrganizationFiscalCode,
  },
  require_secure_channel,
  metadata: {
    scope: ScopeEnum.LOCAL,
    web_url: "aServiceWebUrl" as NonEmptyString,
    app_ios: "aServiceAppIos" as NonEmptyString,
    app_android: "aServiceAppAndroid" as NonEmptyString,
    tos_url: "aServiceTosUrl" as NonEmptyString,
    privacy_url: "aServicePrivacyUrl" as NonEmptyString,
    address: "aServiceAddress" as NonEmptyString,
    phone: "aServicePhone" as NonEmptyString,
    email: "aServiceEmail" as NonEmptyString,
    pec: "aServicePec" as NonEmptyString,
    cta: "aServiceCta" as NonEmptyString,
    token_name: "aServiceTokenName" as NonEmptyString,
    support_url: "aServiceSupportUrl" as NonEmptyString,
    category: CategoryEnum.STANDARD,
    topic_id: 1,
  },
  kind: "publication",
});

export const buildApiResponseServiceDetails = (
  available_notification_channels?: NotificationChannelEnum[]
): ApiResponseServiceDetails => ({
  id: "aServiceId",
  name: "aServiceName",
  version: 1,
  description: "aServiceDescription",
  organization: {
    name: "aServiceOrganization" as NonEmptyString,
    fiscal_code: "01234567890" as OrganizationFiscalCode,
  },
  available_notification_channels,
  metadata: {
    scope: ScopeEnum.LOCAL,
    web_url: "aServiceWebUrl" as NonEmptyString,
    app_ios: "aServiceAppIos" as NonEmptyString,
    app_android: "aServiceAppAndroid" as NonEmptyString,
    tos_url: "aServiceTosUrl" as NonEmptyString,
    privacy_url: "aServicePrivacyUrl" as NonEmptyString,
    address: "aServiceAddress" as NonEmptyString,
    phone: "aServicePhone" as NonEmptyString,
    email: "aServiceEmail" as NonEmptyString,
    pec: "aServicePec" as NonEmptyString,
    cta: "aServiceCta" as NonEmptyString,
    token_name: "aServiceTokenName" as NonEmptyString,
    support_url: "aServiceSupportUrl" as NonEmptyString,
    category: CategoryEnum.STANDARD,
  },
});

export const mockServiceDetailsContainer = (
  statusCode: number,
  resource?: unknown,
  errorMessage?: string,
  reject = false
) => {
  const readMock = reject
    ? vi.fn().mockRejectedValue(new Error(errorMessage))
    : vi.fn().mockResolvedValue({
        statusCode,
        resource,
      });
  return {
    item: vi.fn().mockImplementation(() => ({
      read: readMock,
    })),
  } as unknown as Container;
};
