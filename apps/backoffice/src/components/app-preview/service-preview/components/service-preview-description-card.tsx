import { Stack } from "@mui/material";
import Markdown from "react-markdown";

import { IOColors } from "../../components";
import { SERVICE_PREVIEW_HEADER_OFFSET_HEIGHT } from "./service-preview-header";

interface ServicePreviewDescriptionCardProps {
  descriptionText: string;
}

const ServicePreviewDescriptionCard = ({
  descriptionText,
}: ServicePreviewDescriptionCardProps) => {
  const marginTopValue = SERVICE_PREVIEW_HEADER_OFFSET_HEIGHT - 10;

  return (
    <Stack
      bgcolor="background.paper"
      border={`2px solid ${IOColors["grey-100"]}`}
      borderRadius="8px"
      marginTop={`-${marginTopValue}px`}
      marginX={3}
      paddingX={2}
    >
      <span
        style={{
          color: IOColors["grey-850"],
          fontFamily: "TitilliumSansPro, sans-serif",
          fontSize: "16px",
          lineHeight: "24px",
        }}
      >
        <Markdown>{descriptionText}</Markdown>
      </span>
    </Stack>
  );
};

export default ServicePreviewDescriptionCard;
