import { List } from "@mui/material";
import { Stack } from "@mui/system";
import { useTranslation } from "next-i18next";
import MobileIcon from "../../mobile-icon";
import { ServicePreviewSectionListItem, ServicePreviewSectionTitle } from "./";

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
        text={t("service.inAppPreview.sections.tos.title")}
      />
      <List sx={{ padding: 0 }}>
        <ServicePreviewSectionListItem
          variant="link"
          startIcon={
            <MobileIcon icon="MobileIconMenu" width={24} height={22} />
          }
          url={tosLink}
          text={t("service.inAppPreview.sections.tos.tosLabel")}
          copiable={false}
        />
        <ServicePreviewSectionListItem
          variant="link"
          startIcon={
            <MobileIcon icon="MobileIconSecurity" width={20} height={24} />
          }
          url={privacyLink}
          text={t("service.inAppPreview.sections.tos.privacyLabel")}
          copiable={false}
        />
      </List>
    </Stack>
  );
};

export default ServicePreviewTOSSection;
