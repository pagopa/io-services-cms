import { Typography } from "@mui/material";
import { Box } from "@mui/system";
import React from "react";

type SectionTitleProps = {
  titleText: string;
};

const ServicePreviewSectionTitle = ({ titleText }: SectionTitleProps) => {
  return (
    <Box paddingBottom={1}>
      <Typography fontSize="16px" lineHeight="24px" color="#555C70">
        {titleText}
      </Typography>
    </Box>
  );
};

export default ServicePreviewSectionTitle;
