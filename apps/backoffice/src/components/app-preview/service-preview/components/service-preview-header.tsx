import { Box, Stack } from "@mui/material";
import {
  AvatarLogo,
  MOBILE_COLOR_GREY_700,
  MOBILE_COLOR_GREY_850,
  MOBILE_COLOR_GREY_TOPBAR,
  MobileTypography
} from "../../components";

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
  return (
    <Stack
      marginBottom={2}
      paddingX={3}
      bgcolor={MOBILE_COLOR_GREY_TOPBAR}
      minHeight={180}
      alignItems="start"
    >
      <Box gap={2} display="flex" alignItems="center" id="preview-header-box">
        <Box
          display="flex"
          justifyContent="start"
          alignItems="center"
          width={74}
        >
          <AvatarLogo
            serviceId={serviceId}
            organizationFiscalCode="12345678901"
          />
        </Box>
        <Box display="flex" justifyContent="center" flexDirection="column">
          <MobileTypography
            color={MOBILE_COLOR_GREY_850}
            fontSize={22}
            fontWeight={400}
            lineHeight="33px"
          >
            {serviceName}
          </MobileTypography>
          <MobileTypography
            color={MOBILE_COLOR_GREY_700}
            fontSize={14}
            fontWeight={400}
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
