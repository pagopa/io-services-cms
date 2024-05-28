import { Service } from "@/types/service";
import { Box, Stack } from "@mui/material";
import {
  ServicePreviewDescriptionCard,
  ServicePreviewHeader,
  ServicePreviewInfoSection,
  ServicePreviewNotificationsSection,
  ServicePreviewTOSSection,
  ServicePreviewTopbar
} from "./components/";

import styles from "../app-preview.module.css";
import { useEffect, useRef, useState } from "react";

type ServicePreviewProps = {
  service?: Service;
};

const ServicePreview = ({ service }: ServicePreviewProps) => {
  const organizationData = {
    institutionName:
      "PCM - Dipartimento per le Politiche Giovanili ei il Servizio Civile Universale",
    fiscalCode: "11223344556"
  };

  const [scrollY, setScrollY] = useState(0);
  const boxRef = useRef<HTMLDivElement>();

  // Effect that runs on mount and unmount
  useEffect(() => {
    const handleScroll = () => {
      if (boxRef && boxRef.current) {
        setScrollY(boxRef.current.scrollTop); // Update scroll position
      }
    };

    boxRef.current?.addEventListener("scroll", handleScroll);
  }, []);

  const opacity = Math.min(1, scrollY / 50); // Calculate opacity based on scroll position

  return (
    <Stack flexGrow={1} flexDirection="column" width={360} height={650}>
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
              serviceId={service.id}
            />

            <Stack gap={5}>
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
                serviceId={service.id}
              />
            </Stack>
          </>
        )}
      </Box>
    </Stack>
  );
};

export default ServicePreview;
