import { ServiceLifecycleStatus } from "@/generated/api/ServiceLifecycleStatus";
import { ScopeEnum } from "@/generated/api/ServiceMetadata";
import { ServicePublicationStatusType } from "@/generated/api/ServicePublicationStatusType";

/** Service type used to create/modify/view details */
export type Service = {
  id: string;
  status: ServiceLifecycleStatus;
  visibility?: ServicePublicationStatusType;
  lastUpdate: string;
  name: string;
  description: string;
  requireSecureChannel: boolean;
  authorizedRecipients: string[];
  maxAllowedPaymentAmount: number;
  metadata: {
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
};
