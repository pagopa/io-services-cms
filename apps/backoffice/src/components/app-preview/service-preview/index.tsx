import { Service } from "@/types/service";
import { Box, Stack } from "@mui/material";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import {
  ServicePreviewCTAs,
  ServicePreviewDescriptionCard,
  ServicePreviewHeader,
  ServicePreviewInfoSection,
  ServicePreviewNotificationsSection,
  ServicePreviewTOSSection,
  ServicePreviewTopbar
} from "./components/";

import styles from "../app-preview.module.css";

type ServicePreviewProps = {
  service?: Service;
};

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
    <Stack flexGrow={1} flexDirection="column" width={360} height={650}>
      {service && (
        <>
          <ServicePreviewTopbar
            serviceName={service.name}
            opacity={scrollBoxOpacity}
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
              institutionName={session?.user?.institution.name ?? ""}
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
                appStoreLink={
                  service.metadata.app_android
                    ? service.metadata.app_android
                    : service.metadata.app_ios
                    ? service.metadata.app_ios
                    : undefined
                }
                customerCareLink={service.metadata.support_url}
                phoneNumber={service.metadata.phone}
                email={service.metadata.email}
                pec={service.metadata.pec}
                fiscalCode={session?.user?.institution.fiscalCode}
                address={service.metadata.address}
                serviceId={service.id}
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
