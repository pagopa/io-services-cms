import { Stack } from "@mui/system";
import React, { ReactNode } from "react";
import { ServicePreviewSectionTitle, ServicePreviewSectionListItem } from "./";
import { MenuBook, GppGoodOutlined, ContentCopy } from "@mui/icons-material";
import { Divider, List } from "@mui/material";
import { useTranslation } from "next-i18next";

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
        titleText={t("service.inAppPreview.sections.info.title")}
      />
      <List>
        <ServicePreviewSectionListItem
          variant="link"
          startIcon={<MenuBook />}
          url={websiteLink}
          text={t("service.inAppPreview.sections.info.websiteLabel")}
          copiable={false}
        />
        <ServicePreviewSectionListItem
          variant="link"
          startIcon={<MenuBook />}
          url={appStoreLink}
          text={t("service.inAppPreview.sections.info.appStoreLabel")}
          copiable={false}
        />
        <ServicePreviewSectionListItem
          variant="link"
          startIcon={<MenuBook />}
          url={customerCareLink}
          text={t("service.inAppPreview.sections.info.customerCareLabel")}
          copiable={false}
        />
        <ServicePreviewSectionListItem
          variant="link"
          startIcon={<MenuBook />}
          url={phoneNumber}
          text={t("service.inAppPreview.sections.info.phoneLabel")}
          copiable={false}
        />
        <ServicePreviewSectionListItem
          variant="link"
          startIcon={<MenuBook />}
          url={email}
          text={t("service.inAppPreview.sections.info.emailLabel")}
          copiable={false}
        />
        <ServicePreviewSectionListItem
          variant="link"
          startIcon={<MenuBook />}
          url={pec}
          text={t("service.inAppPreview.sections.info.pecLabel")}
          copiable={false}
        />
        <ServicePreviewSectionListItem
          variant="info"
          startIcon={<MenuBook />}
          endIcon={<ContentCopy />}
          text={t("service.inAppPreview.sections.info.fiscalCodeLabel")}
          label={fiscalCode}
          copiable={false}
        />
        <ServicePreviewSectionListItem
          variant="info"
          startIcon={<MenuBook />}
          text={t("service.inAppPreview.sections.info.addressLabel")}
          label={address}
          copiable={false}
        />
        <ServicePreviewSectionListItem
          variant="info"
          startIcon={<MenuBook />}
          text={t("service.inAppPreview.sections.info.serviceIDLabel")}
          label={serviceID}
          copiable={false}
        />
      </List>
    </Stack>
  );
};

export default ServicePreviewInfoSection;
