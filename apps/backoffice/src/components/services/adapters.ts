import { ServiceLifecycle } from "@/generated/api/ServiceLifecycle";
import { ServiceLifecycleStatusTypeEnum } from "@/generated/api/ServiceLifecycleStatusType";
import { ServicePublication } from "@/generated/api/ServicePublication";
import { ServicePublicationStatusType } from "@/generated/api/ServicePublicationStatusType";

export const fromServiceLifecycleToService = (
  service?: ServiceLifecycle,
  visibility?: ServicePublicationStatusType
) => {
  if (service) {
    return {
      id: service.id,
      status: service.status,
      visibility,
      lastUpdate: service.last_update,
      name: service.name,
      description: service.description,
      requireSecureChannel: service.require_secure_channel ?? false,
      authorizedRecipients: service.authorized_recipients
        ? ((service.authorized_recipients as unknown) as string[])
        : [],
      maxAllowedPaymentAmount: service.max_allowed_payment_amount ?? 0,
      metadata: {
        webUrl: service.metadata.web_url,
        appIos: service.metadata.app_ios,
        appAndroid: service.metadata.app_android,
        tosUrl: service.metadata.tos_url,
        privacyUrl: service.metadata.privacy_url,
        address: service.metadata.address,
        phone: service.metadata.phone,
        email: service.metadata.email,
        pec: service.metadata.pec,
        cta: service.metadata.cta,
        tokenName: service.metadata.token_name,
        supportUrl: service.metadata.support_url,
        category: service.metadata.category,
        customSpecialFlow: service.metadata.custom_special_flow,
        scope: service.metadata.scope
      }
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
      lastUpdate: service.last_update,
      name: service.name,
      description: service.description,
      requireSecureChannel: service.require_secure_channel ?? false,
      authorizedRecipients: service.authorized_recipients
        ? ((service.authorized_recipients as unknown) as string[])
        : [],
      maxAllowedPaymentAmount: service.max_allowed_payment_amount ?? 0,
      metadata: {
        webUrl: service.metadata.web_url,
        appIos: service.metadata.app_ios,
        appAndroid: service.metadata.app_android,
        tosUrl: service.metadata.tos_url,
        privacyUrl: service.metadata.privacy_url,
        address: service.metadata.address,
        phone: service.metadata.phone,
        email: service.metadata.email,
        pec: service.metadata.pec,
        cta: service.metadata.cta,
        tokenName: service.metadata.token_name,
        supportUrl: service.metadata.support_url,
        category: service.metadata.category,
        customSpecialFlow: service.metadata.custom_special_flow,
        scope: service.metadata.scope
      }
    };
  }
};
