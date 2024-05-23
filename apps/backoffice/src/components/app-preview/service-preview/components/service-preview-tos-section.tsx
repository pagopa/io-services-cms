import { Stack } from "@mui/system";
import React, { ReactNode } from "react";
import { ServicePreviewSectionTitle, ServicePreviewSectionListItem } from "./";
import { MenuBook, GppGoodOutlined } from "@mui/icons-material";
import { Divider, List } from "@mui/material";
import { useTranslation } from "next-i18next";

type ServicePreviewTOSSectionProps = {
  tosLink?: string;
  privacyLink?: string;
};

const ServicePreviewTOSSection = ({
  tosLink,
  privacyLink
}: ServicePreviewTOSSectionProps) => {
  const { t } = useTranslation();

  return (
    <Stack>
      <ServicePreviewSectionTitle
        titleText={t("service.inAppPreview.sections.tos.title")}
      />
      <List>
        <ServicePreviewSectionListItem
          variant="link"
          startIcon={<MenuBook />}
          url={tosLink}
          text={t("service.inAppPreview.sections.tos.tosLabel")}
          copiable={false}
        />
        <ServicePreviewSectionListItem
          variant="link"
          startIcon={<GppGoodOutlined />}
          url={privacyLink}
          text={t("service.inAppPreview.sections.tos.privacyLabel")}
          copiable={false}
        />
      </List>
    </Stack>
  );
};

export default ServicePreviewTOSSection;
