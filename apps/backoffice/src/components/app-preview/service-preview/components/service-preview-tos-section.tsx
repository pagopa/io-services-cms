import { GppGoodOutlined, MenuBook } from "@mui/icons-material";
import { List } from "@mui/material";
import { Stack } from "@mui/system";
import { useTranslation } from "next-i18next";
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
          startIcon={<MenuBook fontSize="inherit" color="inherit" />}
          url={tosLink}
          text={t("service.inAppPreview.sections.tos.tosLabel")}
          copiable={false}
        />
        <ServicePreviewSectionListItem
          variant="link"
          startIcon={<GppGoodOutlined fontSize="inherit" color="inherit" />}
          url={privacyLink}
          text={t("service.inAppPreview.sections.tos.privacyLabel")}
          copiable={false}
        />
      </List>
    </Stack>
  );
};

export default ServicePreviewTOSSection;
