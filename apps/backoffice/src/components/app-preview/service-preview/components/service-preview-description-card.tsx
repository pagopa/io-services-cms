import { Stack } from "@mui/material";
import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import { MOBILE_COLOR_GREY_100, MOBILE_COLOR_GREY_850 } from "../../components";

type ServicePreviewDescriptionCardProps = {
  descriptionText: string;
};

const ServicePreviewDescriptionCard = ({
  descriptionText
}: ServicePreviewDescriptionCardProps) => {
  const [marginTopValue, setMarginTopValue] = useState(-70);

  useEffect(() => {
    let servicePreviewHeaderBoxHeight =
      document.getElementById("preview-header-box")?.offsetHeight || 0;
    if (typeof window !== "undefined") {
      setMarginTopValue(-1 * (servicePreviewHeaderBoxHeight / 15) + 1);
    }
  }, []);

  return (
    <Stack
      paddingX={2}
      marginX={3}
      bgcolor="background.paper"
      borderRadius="8px"
      border={`2px solid ${MOBILE_COLOR_GREY_100}`}
      marginTop={marginTopValue}
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
