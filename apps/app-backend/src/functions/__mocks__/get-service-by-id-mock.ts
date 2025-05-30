/* eslint-disable @typescript-eslint/dot-notation */
import { Container } from "@azure/cosmos";
import { ServiceDetail as CosmosDbServiceDetails } from "@io-services-cms/models";
import {
  NonEmptyString,
  OrganizationFiscalCode,
} from "@pagopa/ts-commons/lib/strings";
import { vi } from "vitest";

import { ScopeTypeEnum } from "../../generated/definitions/internal/ScopeType";
import { ServiceDetails as ApiResponseServiceDetails } from "../../generated/definitions/internal/ServiceDetails";
import { StandardServiceCategoryEnum } from "../../generated/definitions/internal/StandardServiceCategory";

export const buildCosmosDbServiceDetails = (
  require_secure_channel: boolean,
): CosmosDbServiceDetails => ({
  cms_last_update_ts: 1,
  description: "aServiceDescription" as NonEmptyString,
  id: "aServiceId" as NonEmptyString,
  kind: "publication",
  metadata: {
    address: "aServiceAddress" as NonEmptyString,
    app_android: "aServiceAppAndroid" as NonEmptyString,
    app_ios: "aServiceAppIos" as NonEmptyString,
    category: StandardServiceCategoryEnum.STANDARD,
    cta: "aServiceCta" as NonEmptyString,
    email: "aServiceEmail" as NonEmptyString,
    pec: "aServicePec" as NonEmptyString,
    phone: "aServicePhone" as NonEmptyString,
    privacy_url: "aServicePrivacyUrl" as NonEmptyString,
    scope: ScopeTypeEnum.LOCAL,
    support_url: "aServiceSupportUrl" as NonEmptyString,
    token_name: "aServiceTokenName" as NonEmptyString,
    topic_id: 1,
    tos_url: "aServiceTosUrl" as NonEmptyString,
    web_url: "aServiceWebUrl" as NonEmptyString,
  },
  name: "aServiceName" as NonEmptyString,
  organization: {
    fiscal_code: "01234567890" as OrganizationFiscalCode,
    name: "aServiceOrganization" as NonEmptyString,
  },
  require_secure_channel,
});

export const buildApiResponseServiceDetails =
  (): ApiResponseServiceDetails => ({
    description: "aServiceDescription",
    id: "aServiceId",
    metadata: {
      address: "aServiceAddress" as NonEmptyString,
      app_android: "aServiceAppAndroid" as NonEmptyString,
      app_ios: "aServiceAppIos" as NonEmptyString,
      category: StandardServiceCategoryEnum.STANDARD,
      cta: "aServiceCta" as NonEmptyString,
      email: "aServiceEmail" as NonEmptyString,
      pec: "aServicePec" as NonEmptyString,
      phone: "aServicePhone" as NonEmptyString,
      privacy_url: "aServicePrivacyUrl" as NonEmptyString,
      scope: ScopeTypeEnum.LOCAL,
      support_url: "aServiceSupportUrl" as NonEmptyString,
      token_name: "aServiceTokenName" as NonEmptyString,
      tos_url: "aServiceTosUrl" as NonEmptyString,
      web_url: "aServiceWebUrl" as NonEmptyString,
    },
    name: "aServiceName",
    organization: {
      fiscal_code: "01234567890" as OrganizationFiscalCode,
      name: "aServiceOrganization" as NonEmptyString,
    },
  });

export const mockServiceDetailsContainer = (
  statusCode: number,
  resource?: unknown,
  errorMessage?: string,
  reject = false,
) => {
  const readMock = reject
    ? vi.fn().mockRejectedValue(new Error(errorMessage))
    : vi.fn().mockResolvedValue({
        resource,
        statusCode,
      });
  return {
    item: vi.fn().mockImplementation(() => ({
      read: readMock,
    })),
  } as unknown as Container;
};
