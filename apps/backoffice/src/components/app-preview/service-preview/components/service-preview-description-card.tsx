import React from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import Markdown from "react-markdown";

type ServicePreviewDescriptionCardiProps = {
  descriptionText: string;
};

const ServicePreviewDescriptionCard = ({
  descriptionText
}: ServicePreviewDescriptionCardiProps) => {
  return (
    <Stack
      borderRadius={2}
      padding={2}
      marginBottom={3}
      sx={{ backgroundColor: "white", border: "2px solid #f7f7f7" }}
    >
      <span style={{ fontSize: "16px", lineHeight: "24px" }}>
        <Markdown>{descriptionText}</Markdown>
      </span>
    </Stack>
  );
};

export default ServicePreviewDescriptionCard;
