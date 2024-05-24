import {
  ContentCopy,
  EmailRounded,
  ForumRounded,
  LanguageRounded,
  MarkEmailReadRounded,
  MenuBook,
  PhoneInTalkRounded,
  PhoneIphoneRounded,
  PlaceRounded,
  PushPinRounded
} from "@mui/icons-material";
import { List } from "@mui/material";
import { Stack } from "@mui/system";
import { useTranslation } from "next-i18next";
import { ServicePreviewSectionListItem, ServicePreviewSectionTitle } from "./";

type ServicePreviewInfoSectionProps = {
  websiteLink?: string;
  appStoreLink?: string;
  customerCareLink?: string;
  phoneNumber?: string;
  email?: string;
  pec?: string;
  fiscalCode?: string;
  address?: string;
  serviceID?: string;
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
  serviceID
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
          startIcon={<LanguageRounded fontSize="inherit" color="inherit"/>}
          url={websiteLink}
          text={t("service.inAppPreview.sections.info.websiteLabel")}
          copiable={false}
        />
        <ServicePreviewSectionListItem
          variant="link"
          startIcon={<PhoneIphoneRounded fontSize="inherit" color="inherit"/>}
          url={appStoreLink}
          text={t("service.inAppPreview.sections.info.appStoreLabel")}
          copiable={false}
        />
        <ServicePreviewSectionListItem
          variant="link"
          startIcon={<ForumRounded fontSize="inherit" color="inherit"/>}
          url={customerCareLink}
          text={t("service.inAppPreview.sections.info.customerCareLabel")}
          copiable={false}
        />
        <ServicePreviewSectionListItem
          variant="link"
          startIcon={<PhoneInTalkRounded fontSize="inherit" color="inherit"/>}
          url={phoneNumber}
          text={t("service.inAppPreview.sections.info.phoneLabel")}
          copiable={false}
        />
        <ServicePreviewSectionListItem
          variant="link"
          startIcon={<EmailRounded fontSize="inherit" color="inherit"/>}
          url={email}
          text={t("service.inAppPreview.sections.info.emailLabel")}
          copiable={false}
        />
        <ServicePreviewSectionListItem
          variant="link"
          startIcon={<MarkEmailReadRounded fontSize="inherit" color="inherit"/>}
          url={pec}
          text={t("service.inAppPreview.sections.info.pecLabel")}
          copiable={false}
        />
        <ServicePreviewSectionListItem
          variant="info"
          startIcon={<MenuBook fontSize="inherit" color="inherit"/>}
          endIcon={<ContentCopy />}
          text={t("service.inAppPreview.sections.info.fiscalCodeLabel")}
          label={fiscalCode}
          copiable={false}
        />
        <ServicePreviewSectionListItem
          variant="info"
          startIcon={<PlaceRounded fontSize="inherit" color="inherit"/>}
          text={t("service.inAppPreview.sections.info.addressLabel")}
          label={address}
          copiable={false}
        />
        <ServicePreviewSectionListItem
          variant="info"
          startIcon={<PushPinRounded fontSize="inherit" color="inherit"/>}
          text={t("service.inAppPreview.sections.info.serviceIDLabel")}
          label={serviceID}
          copiable={false}
        />
      </List>
    </Stack>
  );
};

export default ServicePreviewInfoSection;
