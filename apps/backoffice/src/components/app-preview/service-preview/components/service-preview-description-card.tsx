import { Stack } from "@mui/material";
import Markdown from "react-markdown";

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
      border="2px solid #E8EBF1"
    >
      <span style={{ color: "#0E0F13", fontSize: "16px", lineHeight: "24px" }}>
        <Markdown>{descriptionText}</Markdown>
      </span>
    </Stack>
  );
};

export default ServicePreviewDescriptionCard;
