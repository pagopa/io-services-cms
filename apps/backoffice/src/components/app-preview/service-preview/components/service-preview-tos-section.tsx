import { useTranslation } from "next-i18next";

import { MobileIcon } from "../../components";
import ServicePreviewSectionList from "./service-preview-section-list";
import { ServicePreviewSectionListItemProps } from "./service-preview-section-list-item";

interface ServicePreviewTOSSectionProps {
  privacyLink?: string;
  tosLink?: string;
}

const ServicePreviewTOSSection = ({
  privacyLink,
  tosLink,
}: ServicePreviewTOSSectionProps) => {
  const { t } = useTranslation();
  const serviceTos: ServicePreviewSectionListItemProps[] = [
    {
      isUrl: true,
      label: t("service.inAppPreview.sections.tos.tosLabel"),
      startIcon: <MobileIcon height={22} icon="MobileIconMenu" width={24} />,
      value: tosLink,
      variant: "link",
    },
    {
      isUrl: true,
      label: t("service.inAppPreview.sections.tos.privacyLabel"),
      startIcon: (
        <MobileIcon height={24} icon="MobileIconSecurity" width={20} />
      ),
      value: privacyLink,
      variant: "link",
    },
  ];

  return (
    <ServicePreviewSectionList
      items={serviceTos}
      title="service.inAppPreview.sections.tos.title"
    />
  );
};

export default ServicePreviewTOSSection;
