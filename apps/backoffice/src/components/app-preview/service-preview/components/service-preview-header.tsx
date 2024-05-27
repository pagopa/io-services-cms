import { Box, Stack } from "@mui/material";
import { MobileTypography } from "../../components";
import { AvatarLogo } from "../../components/avatar-logo";

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
    <Stack gap={2} flexDirection="row" marginBottom={2} paddingX={3}>
      <Box display="flex" justifyContent="start" alignItems="center" width={74}>
        <AvatarLogo
          serviceId={serviceId}
          organizationFiscalCode="12345678901"
        />
      </Box>
      <Box display="flex" justifyContent="center" flexDirection="column">
        <MobileTypography
          color="#0E0F13"
          fontSize={22}
          fontWeight={400}
          lineHeight="33px"
        >
          {serviceName}
        </MobileTypography>
        <MobileTypography
          color="#555C70"
          fontSize={14}
          fontWeight={400}
          lineHeight="21px"
        >
          {institutionName}
        </MobileTypography>
      </Box>
    </Stack>
  );
};

export default ServicePreviewHeader;
