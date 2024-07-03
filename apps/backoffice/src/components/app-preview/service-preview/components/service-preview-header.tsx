import { Box, Stack } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import {
  AvatarLogo,
  MOBILE_COLOR_GREY_700,
  MOBILE_COLOR_GREY_850,
  MOBILE_COLOR_GREY_TOPBAR,
  MobileTypography
} from "../../components";

export const SERVICE_PREVIEW_HEADER_OFFSET_HEIGHT = 120;

type ServicePreviewHeaderProps = {
  serviceName: string;
  institutionName: string;
  serviceId: string;
};

const ServicePreviewHeader = ({
  serviceName,
  institutionName,
  serviceId
}: ServicePreviewHeaderProps) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const [minHeight, setMinHeight] = useState<number>(0);

  useEffect(() => {
    const updateMinHeight = () => {
      if (boxRef.current) {
        setMinHeight(
          boxRef.current.offsetHeight + SERVICE_PREVIEW_HEADER_OFFSET_HEIGHT
        );
      }
    };
    // Initial update
    updateMinHeight();
    // Update on window resize
    window.addEventListener("resize", updateMinHeight);
    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener("resize", updateMinHeight);
    };
  }, []);

  return (
    <Stack
      paddingX={3}
      bgcolor={MOBILE_COLOR_GREY_TOPBAR}
      minHeight={minHeight}
      alignItems="start"
    >
      <Box gap={2} display="flex" alignItems="center" ref={boxRef}>
        <Box
          display="flex"
          justifyContent="start"
          alignItems="center"
          width={74}
        >
          <AvatarLogo serviceId={serviceId} organizationFiscalCode="" />
        </Box>
        <Box display="flex" justifyContent="center" flexDirection="column">
          <MobileTypography
            color={MOBILE_COLOR_GREY_850}
            fontSize={22}
            fontWeight={600}
            lineHeight="33px"
          >
            {serviceName}
          </MobileTypography>
          <MobileTypography
            color={MOBILE_COLOR_GREY_700}
            fontSize={14}
            fontWeight={600}
            lineHeight="21px"
          >
            {institutionName}
          </MobileTypography>
        </Box>
      </Box>
    </Stack>
  );
};

export default ServicePreviewHeader;
