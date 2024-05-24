import { Box, Stack } from "@mui/material";
import { MobileTypography } from "../../components";

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
        <Avatar serviceId={serviceId} organizationFiscalCode="12345678901" />
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

type AvatarProps = {
  serviceId: string;
  organizationFiscalCode: string;
};

const Avatar = (props: AvatarProps) => {
  return (
    <Box
      width={66}
      height={66}
      padding={1}
      borderRadius={1}
      border="1px solid #E7E7E7"
    >
      <Box width={48} height={48} bgcolor="blue" />
    </Box>
  );
};

export default ServicePreviewHeader;
