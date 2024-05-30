import { Stack } from "@mui/material";
import Markdown from "react-markdown";
import { MOBILE_COLOR_GREY_100, MOBILE_COLOR_GREY_850 } from "../../components";

type ServicePreviewDescriptionCardProps = {
  descriptionText: string;
};

const ServicePreviewDescriptionCard = ({
  descriptionText
}: ServicePreviewDescriptionCardProps) => {
  return (
    <Stack
      paddingX={2}
      marginX={3}
      bgcolor="background.paper"
      borderRadius="8px"
      border={`2px solid ${MOBILE_COLOR_GREY_100}`}
      marginTop="-70px"
    >
      <span
        style={{
          color: MOBILE_COLOR_GREY_850,
          fontFamily: "'Readex Pro', sans-serif",
          fontSize: "14px",
          lineHeight: "24px"
        }}
      >
        <Markdown>{descriptionText}</Markdown>
      </span>
    </Stack>
  );
};

export default ServicePreviewDescriptionCard;
