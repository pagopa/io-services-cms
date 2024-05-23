import React from "react";
import { Box, Button, Stack, Typography } from "@mui/material";

type ServicePreviewHeaderProps = {
  serviceName: string;
  institutionName: string;
  serviceID: string;
};

const ServicePreviewHeader = ({
  serviceName,
  institutionName,
  serviceID
}: ServicePreviewHeaderProps) => {
  return (
    <Stack gap={2} flexDirection="row" marginBottom={3}>
      <Box display="flex" justifyContent="start" alignItems="center" width={74}>
        <Box
          width={66}
          height={66}
          sx={{ backgroundColor: "red", borderRadius: "5px" }}
        ></Box>
      </Box>
      <Box display="flex" justifyContent="center" flexDirection="column">
        <Typography
          sx={{ fontSize: "22px", fontWeight: 400, lineHeight: "33px" }}
        >
          {serviceName}
        </Typography>
        <Typography sx={{ fontSize: "14px", lineHeight: "21px" }}>
          {institutionName}
        </Typography>
      </Box>
    </Stack>
  );
};

export default ServicePreviewHeader;
