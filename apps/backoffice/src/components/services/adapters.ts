import { ServiceLifecycle } from "@/generated/api/ServiceLifecycle";
import { ServiceLifecycleStatusTypeEnum } from "@/generated/api/ServiceLifecycleStatusType";
import { ServiceMetadata } from "@/generated/api/ServiceMetadata";
import { ServicePublication } from "@/generated/api/ServicePublication";
import { ServicePublicationStatusType } from "@/generated/api/ServicePublicationStatusType";

const adaptServiceCommonData = (
  service: ServiceLifecycle | ServicePublication
) => ({
  lastUpdate: service.last_update,
  name: service.name,
  description: service.description,
  requireSecureChannel: service.require_secure_channel ?? false,
  authorizedCidrs: service.authorized_cidrs
    ? ((service.authorized_recipients as unknown) as string[])
    : [],
  authorizedRecipients: service.authorized_recipients
    ? ((service.authorized_recipients as unknown) as string[])
    : [],
  maxAllowedPaymentAmount: service.max_allowed_payment_amount ?? 0
});

const adaptServiceMetadata = (metadata: ServiceMetadata) => ({
  webUrl: metadata.web_url,
  appIos: metadata.app_ios,
  appAndroid: metadata.app_android,
  tosUrl: metadata.tos_url,
  privacyUrl: metadata.privacy_url,
  address: metadata.address,
  phone: metadata.phone,
  email: metadata.email,
  pec: metadata.pec,
  cta: metadata.cta,
  tokenName: metadata.token_name,
  supportUrl: metadata.support_url,
  category: metadata.category,
  customSpecialFlow: metadata.custom_special_flow,
  scope: metadata.scope
});

export const fromServiceLifecycleToService = (
  service?: ServiceLifecycle,
  visibility?: ServicePublicationStatusType
) => {
  if (service) {
    return {
      id: service.id,
      status: service.status,
      visibility,
      ...adaptServiceCommonData(service),
      metadata: adaptServiceMetadata(service.metadata)
    };
  }
};

export const fromServicePublicationToService = (
  service?: ServicePublication
) => {
  if (service) {
    return {
      id: service.id,
      status: { value: ServiceLifecycleStatusTypeEnum.approved },
      visibility: service?.status,
      ...adaptServiceCommonData(service),
      metadata: adaptServiceMetadata(service.metadata)
    };
  }
};
