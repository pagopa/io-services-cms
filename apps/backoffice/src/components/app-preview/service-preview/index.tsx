import { Service } from "@/types/service";
import { Box, Stack } from "@mui/material";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

import styles from "../app-preview.module.css";
import {
  ServicePreviewCTAs,
  ServicePreviewDescriptionCard,
  ServicePreviewHeader,
  ServicePreviewInfoSection,
  ServicePreviewNotificationsSection,
  ServicePreviewTOSSection,
  ServicePreviewTopbar,
} from "./components/";

interface ServicePreviewProps {
  service?: Service;
}

const ServicePreview = ({ service }: ServicePreviewProps) => {
  const { data: session } = useSession();

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
    <Stack flexDirection="column" flexGrow={1} height={650} width={360}>
      {service && (
        <>
          <ServicePreviewTopbar
            opacity={scrollBoxOpacity}
            serviceName={service.name}
          />
          <Box
            className={styles.scrollbar}
            display="flex"
            flexDirection="column"
            ref={scrollBoxRef}
            sx={{
              overflowY: "scroll",
            }}
          >
            <ServicePreviewHeader
              institutionName={session?.user?.institution.name ?? ""}
              serviceId={service.id}
              serviceName={service.name}
            />

            <Stack gap={5}>
              <ServicePreviewDescriptionCard
                descriptionText={service.description}
              />

              <ServicePreviewTOSSection
                privacyLink={service.metadata.privacy_url}
                tosLink={service.metadata.tos_url}
              />

              <ServicePreviewNotificationsSection />

              <ServicePreviewInfoSection
                address={service.metadata.address}
                appStoreLink={
                  service.metadata.app_android
                    ? service.metadata.app_android
                    : service.metadata.app_ios
                      ? service.metadata.app_ios
                      : undefined
                }
                customerCareLink={service.metadata.support_url}
                email={service.metadata.email}
                fiscalCode={session?.user?.institution.fiscalCode}
                pec={service.metadata.pec}
                phoneNumber={service.metadata.phone}
                serviceId={service.id}
                websiteLink={service.metadata.web_url}
              />
            </Stack>
          </Box>
          <ServicePreviewCTAs cta={service.metadata.cta} />
        </>
      )}
    </Stack>
  );
};

export default ServicePreview;
