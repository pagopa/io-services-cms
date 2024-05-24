import { List } from "@mui/material";
import { Stack } from "@mui/system";
import { useTranslation } from "next-i18next";
import { ServicePreviewSectionTitle } from "./";

type ServicePreviewNotificationsSectionProps = {};

const ServicePreviewNotificationsSection = ({}: ServicePreviewNotificationsSectionProps) => {
  const { t } = useTranslation();
  return (
    <Stack>
      <ServicePreviewSectionTitle
        text={t("service.inAppPreview.sections.notifications.title")}
      />
      <List sx={{ padding: 0 }}></List>
    </Stack>
  );
};

export default ServicePreviewNotificationsSection;
