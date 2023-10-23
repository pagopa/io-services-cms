import { ServiceLifecycleStatus } from "@/generated/api/ServiceLifecycleStatus";
import { ScopeEnum } from "@/generated/api/ServiceMetadata";
import { ServicePublicationStatusType } from "@/generated/api/ServicePublicationStatusType";

export type ServiceOrganization = {
  name: string;
  fiscalCode: string;
  departmentName: string;
};

export type ServiceCommonData = {
  name: string;
  description: string;
  requireSecureChannel: boolean;
  authorizedCidrs: string[];
  authorizedRecipients: string[];
  maxAllowedPaymentAmount: number;
};

export type ServiceMetadata = {
  webUrl?: string;
  appIos?: string;
  appAndroid?: string;
  tosUrl?: string;
  privacyUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
  pec?: string;
  cta?: string;
  tokenName?: string;
  supportUrl?: string;
  category?: string;
  customSpecialFlow?: string;
  scope: ScopeEnum;
};

export type AssistanceChannelType = "email" | "pec" | "phone" | "supportUrl";
export type AssistanceChannel = { type: AssistanceChannelType; value: string };

export type ServicePayloadMetadata = {
  webUrl?: string;
  appIos?: string;
  appAndroid?: string;
  tosUrl?: string;
  privacyUrl?: string;
  address?: string;
  cta?: {
    text: string;
    url: string;
  };
  assistanceChannels: AssistanceChannel[];
  tokenName?: string;
  category?: string;
  customSpecialFlow?: string;
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

/** `ServicePayload` type used to create/update services in frontend forms.\
 * It will be converted in _io-services-cms Api ServicePayload_ before call create/update csm service Api. */
export type ServicePayload = {
  organization?: ServiceOrganization;
  metadata: ServicePayloadMetadata;
} & ServiceCommonData;
