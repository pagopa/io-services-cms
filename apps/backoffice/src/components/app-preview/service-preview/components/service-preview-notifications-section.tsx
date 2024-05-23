import { Stack } from "@mui/system";
import React, { ReactNode } from "react";
import { ServicePreviewSectionTitle, ServicePreviewSectionListItem } from "./";
import { MenuBook, GppGoodOutlined } from "@mui/icons-material";
import { Divider, List } from "@mui/material";
import { useTranslation } from "next-i18next";

type ServicePreviewNotificationsSectionProps = {};

const ServicePreviewNotificationsSection = ({}: ServicePreviewNotificationsSectionProps) => {
  const { t } = useTranslation();
  return (
    <Stack>
      <ServicePreviewSectionTitle
        titleText={t("service.inAppPreview.sections.notifications.title")}
      />
      <List></List>
    </Stack>
  );
};

export default ServicePreviewNotificationsSection;
