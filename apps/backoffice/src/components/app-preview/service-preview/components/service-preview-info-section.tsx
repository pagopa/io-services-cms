import { useTranslation } from "next-i18next";

import { MobileIcon } from "../../components";
import ServicePreviewSectionList from "./service-preview-section-list";
import { ServicePreviewSectionListItemProps } from "./service-preview-section-list-item";

interface ServicePreviewInfoSectionProps {
  address?: string;
  appStoreLink?: string;
  customerCareLink?: string;
  email?: string;
  fiscalCode?: string;
  pec?: string;
  phoneNumber?: string;
  serviceId?: string;
  websiteLink?: string;
}

const ServicePreviewInfoSection = ({
  address,
  appStoreLink,
  customerCareLink,
  email,
  fiscalCode,
  pec,
  phoneNumber,
  serviceId,
  websiteLink,
}: ServicePreviewInfoSectionProps) => {
  const { t } = useTranslation();
  const serviceInfo: ServicePreviewSectionListItemProps[] = [
    {
      isUrl: true,
      label: t("service.inAppPreview.sections.info.websiteLabel"),
      startIcon: <MobileIcon height={24} icon="MobileIconWebsite" width={24} />,
      value: websiteLink,
      variant: "link",
    },
    {
      label: t("service.inAppPreview.sections.info.appStoreLabel"),
      startIcon: (
        <MobileIcon height={24} icon="MobileIconPhoneApp" width={16} />
      ),
      value: appStoreLink,
      variant: "link",
    },
    {
      isUrl: true,
      label: t("service.inAppPreview.sections.info.customerCareLabel"),
      startIcon: (
        <MobileIcon height={24} icon="MobileIconCustomerCare" width={24} />
      ),
      value: customerCareLink,
      variant: "link",
    },
    {
      label: t("service.inAppPreview.sections.info.phoneLabel"),
      startIcon: (
        <MobileIcon height={24} icon="MobileIconPhoneCall" width={24} />
      ),
      value: phoneNumber,
      variant: "link",
    },
    {
      isEmail: true,
      label: t("service.inAppPreview.sections.info.emailLabel"),
      startIcon: <MobileIcon height={20} icon="MobileIconEmail" width={24} />,
      value: email,
      variant: "link",
    },
    {
      isEmail: true,
      label: t("service.inAppPreview.sections.info.pecLabel"),
      startIcon: <MobileIcon height={22} icon="MobileIconPec" width={24} />,
      value: pec,
      variant: "link",
    },
    {
      endIcon: <MobileIcon height={25} icon="MobileIconCopy" width={24} />,
      isPrimaryValue: true,
      label: t("service.inAppPreview.sections.info.fiscalCodeLabel"),
      startIcon: (
        <MobileIcon height={21} icon="MobileIconFiscalCode" width={24} />
      ),
      value: fiscalCode,
      variant: "info",
    },
    {
      label: t("service.inAppPreview.sections.info.addressLabel"),
      startIcon: <MobileIcon height={24} icon="MobileIconAddress" width={20} />,
      value: address,
      variant: "info",
    },
    {
      label: t("service.inAppPreview.sections.info.serviceIDLabel"),
      startIcon: <MobileIcon height={25} icon="MobileIconId" width={24} />,
      value: serviceId,
      variant: "info",
    },
  ];

  return (
    <ServicePreviewSectionList
      items={serviceInfo}
      title="service.inAppPreview.sections.info.title"
    />
  );
};

export default ServicePreviewInfoSection;
