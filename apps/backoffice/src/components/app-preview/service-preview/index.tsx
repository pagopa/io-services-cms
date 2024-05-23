import { Stack, Box } from "@mui/material";
import {
  ServicePreviewDescriptionCard,
  ServicePreviewHeader,
  ServicePreviewInfoSection,
  ServicePreviewNotificationsSection,
  ServicePreviewTopbar,
  ServicePreviewTOSSection
} from "./components/";
import { Service } from "@/types/service";

import styles from "../app-preview.module.css";

type ServicePreviewProps = {
  service?: Service;
};

const ServicePreview = ({ service }: ServicePreviewProps) => {
  const organizationData = {
    institutionName:
      "PCM - Dipartimento per le Politiche Giovanili ei il Servizio Civile Universale",
    fiscalCode: "11223344556"
  };
  return (
    <>
      {/* <Box
        height={200}
        width={186}
        sx={{
          backgroundColor: "#f7f7f7",
          position: "absolute",
          borderRadius: "8px 8px 0 0"
        }}
      /> */}

      <Stack
        flexGrow={1}
        padding={2}
        flexDirection="column"
        sx={{ position: "relative" }}
        width={360}
        height={650}
      >
        <ServicePreviewTopbar />
        <Box
          display="flex"
          flexDirection="column"
          sx={{
            overflowY: "scroll"
          }}
          className={styles.scrollbar}
        >
          {service && (
            <>
              <ServicePreviewHeader
                serviceName={service.name}
                institutionName={organizationData.institutionName}
                serviceID={service.id}
              />

              <ServicePreviewDescriptionCard
                descriptionText={service.description}
              />

              <ServicePreviewTOSSection
                tosLink={service.metadata.tos_url}
                privacyLink={service.metadata.privacy_url}
              />

              <ServicePreviewNotificationsSection />

              <ServicePreviewInfoSection
                websiteLink={service.metadata.web_url}
                appStoreLink={service.metadata.app_android}
                customerCareLink={service.metadata.support_url}
                phoneNumber={service.metadata.phone}
                email={service.metadata.email}
                pec={service.metadata.pec}
                fiscalCode={organizationData.fiscalCode}
                address={service.metadata.address}
                serviceID={service.id}
              />
            </>
          )}
        </Box>
      </Stack>
    </>
  );
};

export default ServicePreview;
