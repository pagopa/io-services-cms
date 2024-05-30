import { List } from "@mui/material";
import { Stack } from "@mui/system";
import { useTranslation } from "next-i18next";
import MobileIcon from "../../mobile-icon";
import { ServicePreviewSectionListItem, ServicePreviewSectionTitle } from "./";
import { MOBILE_COLOR_GREY_650 } from "../../components";

type ServicePreviewInfoSectionProps = {
  websiteLink?: string;
  appStoreLink?: string;
  customerCareLink?: string;
  phoneNumber?: string;
  email?: string;
  pec?: string;
  fiscalCode?: string;
  address?: string;
  serviceId?: string;
};

const ServicePreviewInfoSection = ({
  websiteLink,
  appStoreLink,
  customerCareLink,
  phoneNumber,
  email,
  pec,
  fiscalCode,
  address,
  serviceId
}: ServicePreviewInfoSectionProps) => {
  const { t } = useTranslation();
  return (
    <Stack>
      <ServicePreviewSectionTitle
        text={t("service.inAppPreview.sections.info.title")}
      />
      <List>
        <ServicePreviewSectionListItem
          variant="link"
          startIcon={
            <MobileIcon icon="MobileIconWebsite" width={24} height={24} />
          }
          url={websiteLink}
          text={t("service.inAppPreview.sections.info.websiteLabel")}
          copiable={false}
        />
        <ServicePreviewSectionListItem
          variant="link"
          startIcon={
            <MobileIcon icon="MobileIconPhoneApp" width={16} height={24} />
          }
          url={appStoreLink}
          text={t("service.inAppPreview.sections.info.appStoreLabel")}
          copiable={false}
        />
        <ServicePreviewSectionListItem
          variant="link"
          startIcon={
            <MobileIcon icon="MobileIconCustomerCare" width={24} height={24} />
          }
          url={customerCareLink}
          text={t("service.inAppPreview.sections.info.customerCareLabel")}
          copiable={false}
        />
        <ServicePreviewSectionListItem
          variant="link"
          startIcon={
            <MobileIcon icon="MobileIconPhoneCall" width={24} height={24} />
          }
          url={phoneNumber}
          text={t("service.inAppPreview.sections.info.phoneLabel")}
          copiable={false}
        />
        <ServicePreviewSectionListItem
          variant="link"
          startIcon={
            <MobileIcon icon="MobileIconEmail" width={24} height={20} />
          }
          url={email}
          text={t("service.inAppPreview.sections.info.emailLabel")}
          copiable={false}
        />
        <ServicePreviewSectionListItem
          variant="link"
          startIcon={<MobileIcon icon="MobileIconPec" width={24} height={22} />}
          url={pec}
          text={t("service.inAppPreview.sections.info.pecLabel")}
          copiable={false}
        />
        <ServicePreviewSectionListItem
          variant="info"
          startIcon={
            <MobileIcon icon="MobileIconFiscalCode" width={24} height={21} />
          }
          endIcon={<MobileIcon icon="MobileIconCopy" width={24} height={25} />}
          text={t("service.inAppPreview.sections.info.fiscalCodeLabel")}
          label={fiscalCode}
          copiable={false}
        />
        <ServicePreviewSectionListItem
          variant="info"
          startIcon={
            <MobileIcon icon="MobileIconAddress" width={20} height={24} />
          }
          text={t("service.inAppPreview.sections.info.addressLabel")}
          label={address}
          copiable={false}
        />
        <ServicePreviewSectionListItem
          variant="info"
          startIcon={<MobileIcon icon="MobileIconId" width={24} height={25} />}
          text={t("service.inAppPreview.sections.info.serviceIDLabel")}
          label={serviceId}
          copiable={false}
        />
      </List>
    </Stack>
  );
};

export default ServicePreviewInfoSection;
