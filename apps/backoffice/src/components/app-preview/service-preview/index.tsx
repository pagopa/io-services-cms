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

import { useEffect, useRef, useState } from "react";
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

  const [scrollY, setScrollY] = useState(0);
  const scrollBoxRef = useRef<HTMLDivElement>();
  const scrollBoxOpacity = Math.min(1, scrollY / 50); // Calculate opacity based on scroll position

  useEffect(() => {
    const handleScroll = () => {
      if (scrollBoxRef && scrollBoxRef.current) {
        setScrollY(scrollBoxRef.current.scrollTop); // Update scroll position
      }
    };

    scrollBoxRef.current?.addEventListener("scroll", handleScroll);
  }, []);

  return (
    <Stack flexGrow={1} flexDirection="column" width={360} height={650}>
      {service && (
        <>
          <ServicePreviewTopbar
            serviceName={service.name}
            opacity={scrollBoxOpacity}
          />
          <Box
            zIndex={-10}
            height={200}
            width={186}
            sx={{
              backgroundColor: `rgb(244,245,248,${1 - scrollBoxOpacity})`,
              position: "absolute"
            }}
          />
          <Box
            display="flex"
            flexDirection="column"
            sx={{
              overflowY: "scroll"
            }}
            ref={scrollBoxRef}
            className={styles.scrollbar}
          >
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
          </Box>
        </>
      )}
    </Stack>
  );
};

export default ServicePreview;
