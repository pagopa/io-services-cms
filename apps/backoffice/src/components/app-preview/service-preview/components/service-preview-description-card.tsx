import { Stack } from "@mui/material";
import Markdown from "react-markdown";
import { MOBILE_COLOR_GREY_100, MOBILE_COLOR_GREY_850 } from "../../components";
import { SERVICE_PREVIEW_HEADER_OFFSET_HEIGHT } from "./service-preview-header";

type ServicePreviewDescriptionCardProps = {
  descriptionText: string;
};

const ServicePreviewDescriptionCard = ({
  descriptionText
}: ServicePreviewDescriptionCardProps) => {
  const marginTopValue = SERVICE_PREVIEW_HEADER_OFFSET_HEIGHT - 10;

  return (
    <Stack
      paddingX={2}
      marginX={3}
      bgcolor="background.paper"
      borderRadius="8px"
      border={`2px solid ${MOBILE_COLOR_GREY_100}`}
      marginTop={`-${marginTopValue}px`}
    >
      <span
        style={{
          color: MOBILE_COLOR_GREY_850,
          fontFamily: "TitilliumSansPro, sans-serif",
          fontSize: "16px",
          lineHeight: "24px"
        }}
      >
        <Markdown>{descriptionText}</Markdown>
      </span>
    </Stack>
  );
};

export default ServicePreviewDescriptionCard;
