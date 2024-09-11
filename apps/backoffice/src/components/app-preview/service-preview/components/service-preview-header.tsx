import { Box, Stack } from "@mui/material";
import { useEffect, useRef, useState } from "react";

import { AvatarLogo, IOColors, MobileTypography } from "../../components";

export const SERVICE_PREVIEW_HEADER_OFFSET_HEIGHT = 120;

interface ServicePreviewHeaderProps {
  institutionName: string;
  serviceId: string;
  serviceName: string;
}

const ServicePreviewHeader = ({
  institutionName,
  serviceId,
  serviceName,
}: ServicePreviewHeaderProps) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const [minHeight, setMinHeight] = useState<number>(0);

  useEffect(() => {
    const updateMinHeight = () => {
      if (boxRef.current) {
        setMinHeight(
          boxRef.current.offsetHeight + SERVICE_PREVIEW_HEADER_OFFSET_HEIGHT,
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
      alignItems="start"
      bgcolor={IOColors["grey-50"]}
      minHeight={minHeight}
      paddingX={3}
    >
      <Box alignItems="center" display="flex" gap={2} ref={boxRef}>
        <Box
          alignItems="center"
          display="flex"
          justifyContent="start"
          width={74}
        >
          <AvatarLogo organizationFiscalCode="" serviceId={serviceId} />
        </Box>
        <Box display="flex" flexDirection="column" justifyContent="center">
          <MobileTypography
            color={IOColors["grey-850"]}
            fontSize={22}
            fontWeight={600}
            lineHeight="33px"
          >
            {serviceName}
          </MobileTypography>
          <MobileTypography
            color={IOColors["grey-700"]}
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
