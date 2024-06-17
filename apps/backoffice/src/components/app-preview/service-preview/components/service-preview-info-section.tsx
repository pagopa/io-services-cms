import { useTranslation } from "next-i18next";
import MobileIcon from "../../mobile-icon";
import ServicePreviewSectionList from "./service-preview-section-list";
import { ServicePreviewSectionListItemProps } from "./service-preview-section-list-item";

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
  const serviceInfo: ServicePreviewSectionListItemProps[] = [
    {
      variant: "link",
      startIcon: <MobileIcon icon="MobileIconWebsite" width={24} height={24} />,
      value: websiteLink,
      label: t("service.inAppPreview.sections.info.websiteLabel"),
      isUrl: true
    },
    {
      variant: "link",
      startIcon: (
        <MobileIcon icon="MobileIconPhoneApp" width={16} height={24} />
      ),
      value: appStoreLink,
      label: t("service.inAppPreview.sections.info.appStoreLabel"),
      isUrl: true
    },
    {
      variant: "link",
      startIcon: (
        <MobileIcon icon="MobileIconCustomerCare" width={24} height={24} />
      ),
      value: customerCareLink,
      label: t("service.inAppPreview.sections.info.customerCareLabel"),
      isUrl: true
    },
    {
      variant: "link",
      startIcon: (
        <MobileIcon icon="MobileIconPhoneCall" width={24} height={24} />
      ),
      value: phoneNumber,
      label: t("service.inAppPreview.sections.info.phoneLabel")
    },
    {
      variant: "link",
      startIcon: <MobileIcon icon="MobileIconEmail" width={24} height={20} />,
      value: email,
      label: t("service.inAppPreview.sections.info.emailLabel"),
      isEmail: true
    },
    {
      variant: "link",
      startIcon: <MobileIcon icon="MobileIconPec" width={24} height={22} />,
      value: pec,
      label: t("service.inAppPreview.sections.info.pecLabel"),
      isEmail: true
    },
    {
      variant: "info",
      startIcon: (
        <MobileIcon icon="MobileIconFiscalCode" width={24} height={21} />
      ),
      endIcon: <MobileIcon icon="MobileIconCopy" width={24} height={25} />,
      value: fiscalCode,
      isPrimaryValue: true,
      label: t("service.inAppPreview.sections.info.fiscalCodeLabel")
    },
    {
      variant: "info",
      startIcon: <MobileIcon icon="MobileIconAddress" width={20} height={24} />,
      value: address,
      label: t("service.inAppPreview.sections.info.addressLabel")
    },
    {
      variant: "info",
      startIcon: <MobileIcon icon="MobileIconId" width={24} height={25} />,
      value: serviceId,
      label: t("service.inAppPreview.sections.info.serviceIDLabel")
    }
  ];

  return (
    <ServicePreviewSectionList
      title="service.inAppPreview.sections.info.title"
      items={serviceInfo}
    />
  );
};

export default ServicePreviewInfoSection;
