import { Box } from "@mui/material";
import { IOColors, MobileIcon, MobileTypography } from "../../components";

type ServicePreviewTopbarProps = {
  serviceName?: string;
  opacity: number;
};

/** Display App IO top navigation bar */
const ServicePreviewTopbar = ({
  opacity,
  serviceName
}: ServicePreviewTopbarProps) => {
  return (
    <Box
      height={56}
      flexDirection="row"
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      paddingY={2}
      paddingX={3}
      borderBottom={`1px solid ${IOColors["grey-50"]}`}
      sx={{ backgroundColor: `rgb(244,245,248,${1 - opacity})` }}
    >
      <MobileIcon
        icon="MobileIconArrowBack"
        width={24}
        height={24}
        color={IOColors["grey-850"]}
      />

      <MobileTypography
        noWrap
        fontSize={14}
        fontWeight={400}
        lineHeight="33px"
        textOverflow="ellipsis"
        paddingX={2}
        sx={{
          opacity
        }}
      >
        {serviceName}
      </MobileTypography>
      <MobileIcon
        icon="MobileIconQMark"
        width={16}
        height={24}
        color={IOColors["grey-850"]}
      />
    </Box>
  );
};

export default ServicePreviewTopbar;
