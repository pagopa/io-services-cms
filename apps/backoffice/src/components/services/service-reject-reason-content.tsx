import { ErrorOutline } from "@mui/icons-material";

import { DrawerBaseContent } from "../drawer-provider";
import { MarkdownView } from "../markdown-view";

export interface ServiceRejectReasonContentProps {
  value?: string;
}

/** Render service details information */
export const ServiceRejectReasonContent = ({
  value,
}: ServiceRejectReasonContentProps) => {
  const getAllRejectionReasons = () => value?.replaceAll("|", "\n\n");

  return (
    <DrawerBaseContent
      header={{
        startIcon: <ErrorOutline color="error" />,
        title: "service.alerts.rejected.reason.title",
      }}
      maxWidth="415px"
      minWidth="320px"
      width="26vw"
    >
      <MarkdownView>{getAllRejectionReasons()}</MarkdownView>
    </DrawerBaseContent>
  );
};
