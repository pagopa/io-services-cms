import { useTranslation } from "next-i18next";
import { MobileIcon } from "../../components";
import ServicePreviewSectionList from "./service-preview-section-list";
import { ServicePreviewSectionListItemProps } from "./service-preview-section-list-item";

type ServicePreviewTOSSectionProps = {
  tosLink?: string;
  privacyLink?: string;
};

const ServicePreviewTOSSection = ({
  tosLink,
  privacyLink
}: ServicePreviewTOSSectionProps) => {
  const { t } = useTranslation();
  const serviceTos: ServicePreviewSectionListItemProps[] = [
    {
      variant: "link",
      startIcon: <MobileIcon icon="MobileIconMenu" width={24} height={22} />,
      value: tosLink,
      label: t("service.inAppPreview.sections.tos.tosLabel"),
      isUrl: true
    },
    {
      variant: "link",
      startIcon: (
        <MobileIcon icon="MobileIconSecurity" width={20} height={24} />
      ),
      value: privacyLink,
      label: t("service.inAppPreview.sections.tos.privacyLabel"),
      isUrl: true
    }
  ];

  return (
    <ServicePreviewSectionList
      title="service.inAppPreview.sections.tos.title"
      items={serviceTos}
    />
  );
};

export default ServicePreviewTOSSection;
