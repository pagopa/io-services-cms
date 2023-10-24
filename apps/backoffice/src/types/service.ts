import { ServiceLifecycleStatus } from "@/generated/api/ServiceLifecycleStatus";
import { ScopeEnum } from "@/generated/api/ServiceMetadata";
import { ServicePublicationStatusType } from "@/generated/api/ServicePublicationStatusType";

export type ServiceOrganization = {
  name: string;
  fiscal_code: string;
  department_name: string;
};

export type ServiceCommonData = {
  name: string;
  description: string;
  require_secure_channel: boolean;
  authorized_cidrs: string[];
  authorized_recipients: string[];
  max_allowed_payment_amount: number;
};

export type ServiceMetadata = {
  web_url?: string;
  app_ios?: string;
  app_android?: string;
  tos_url?: string;
  privacy_url?: string;
  address?: string;
  phone?: string;
  email?: string;
  pec?: string;
  cta?: string;
  token_name?: string;
  support_url?: string;
  category?: string;
  custom_special_flow?: string;
  scope: ScopeEnum;
};

export type AssistanceChannelType = "email" | "pec" | "phone" | "support_url";
export type AssistanceChannel = { type: AssistanceChannelType; value: string };

export type ServiceCreateUpdatePayloadMetadata = {
  web_url: string;
  app_ios: string;
  app_android: string;
  tos_url: string;
  privacy_url: string;
  address: string;
  cta: {
    text: string;
    url: string;
  };
  assistanceChannels: AssistanceChannel[];
  token_name?: string;
  category?: string;
  custom_special_flow?: string;
  scope: ScopeEnum;
};

/** `Service` type used to view details */
export type Service = {
  id: string;
  status: ServiceLifecycleStatus;
  visibility?: ServicePublicationStatusType;
  lastUpdate: string;
  metadata: ServiceMetadata;
} & ServiceCommonData;

/** `ServiceCreateUpdatePayload` type used to create/update services in frontend forms.\
 * It will be converted in _io-services-cms Api ServicePayload_ before call create/update csm service Api. */
export type ServiceCreateUpdatePayload = {
  organization?: ServiceOrganization;
  metadata: ServiceCreateUpdatePayloadMetadata;
} & ServiceCommonData;
