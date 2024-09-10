import { Box } from "@mui/material";

import { IOColors, MobileIcon, MobileTypography } from "../../components";

interface ServicePreviewTopbarProps {
  opacity: number;
  serviceName?: string;
}

/** Display App IO top navigation bar */
const ServicePreviewTopbar = ({
  opacity,
  serviceName,
}: ServicePreviewTopbarProps) => (
  <Box
    alignItems="center"
    borderBottom={`1px solid ${IOColors["grey-50"]}`}
    display="flex"
    flexDirection="row"
    height={56}
    justifyContent="space-between"
    paddingX={3}
    paddingY={2}
    sx={{ backgroundColor: `rgb(244,245,248,${1 - opacity})` }}
  >
    <MobileIcon
      color={IOColors["grey-850"]}
      height={24}
      icon="MobileIconArrowBack"
      width={24}
    />

    <MobileTypography
      fontSize={14}
      fontWeight={400}
      lineHeight="33px"
      noWrap
      paddingX={2}
      sx={{
        opacity,
      }}
      textOverflow="ellipsis"
    >
      {serviceName}
    </MobileTypography>
    <MobileIcon
      color={IOColors["grey-850"]}
      height={24}
      icon="MobileIconQMark"
      width={16}
    />
  </Box>
);

export default ServicePreviewTopbar;
