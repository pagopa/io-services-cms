import { ScopeEnum } from "@/generated/api/ServiceBaseMetadata";
import { ServiceLifecycleStatus } from "@/generated/api/ServiceLifecycleStatus";
import { ServicePublicationStatusType } from "@/generated/api/ServicePublicationStatusType";
import { ServiceTopic } from "@/generated/api/ServiceTopic";

export interface ServiceOrganization {
  department_name: string;
  fiscal_code: string;
  name: string;
}

export interface ServiceCommonData {
  authorized_cidrs: string[];
  authorized_recipients: string[];
  description: string;
  max_allowed_payment_amount: number;
  name: string;
  require_secure_channel: boolean;
}

export interface ServiceMetadata {
  address?: string;
  app_android?: string;
  app_ios?: string;
  category?: string;
  cta?: string;
  custom_special_flow?: string;
  email?: string;
  pec?: string;
  phone?: string;
  privacy_url?: string;
  scope: ScopeEnum;
  support_url?: string;
  token_name?: string;
  topic?: ServiceTopic;
  tos_url?: string;
  web_url?: string;
}

export type AssistanceChannelType = "email" | "pec" | "phone" | "support_url";
export interface AssistanceChannel {
  type: AssistanceChannelType;
  value: string;
}
export interface AssistanceChannelsMetadata {
  email?: string;
  pec?: string;
  phone?: string;
  support_url?: string;
}

export interface ServiceCreateUpdatePayloadMetadata {
  address: string;
  app_android: string;
  app_ios: string;
  assistanceChannels: AssistanceChannel[];
  category?: string;
  cta: {
    text: string;
    url: string;
  };
  custom_special_flow?: string;
  privacy_url: string;
  scope: ScopeEnum;
  token_name?: string;
  topic_id?: number | string;
  tos_url: string;
  web_url: string;
}

/** `Service` type used to view details */
export type Service = {
  id: string;
  lastUpdate: string;
  metadata: ServiceMetadata;
  status: ServiceLifecycleStatus;
  visibility?: ServicePublicationStatusType;
} & ServiceCommonData;

/** `ServiceCreateUpdatePayload` type used to create/update services in frontend forms.\
 * It will be converted in _io-services-cms Api ServicePayload_ before call create/update csm service Api. */
export type ServiceCreateUpdatePayload = {
  metadata: ServiceCreateUpdatePayloadMetadata;
} & ServiceCommonData;
