import { ErrorOutline } from "@mui/icons-material";
import { Typography } from "@mui/material";
import { Trans } from "next-i18next";

import { DrawerBaseContent } from "../drawer-provider";

export interface ServiceRejectReasonContentProps {
  value?: string;
}

/** Render service details information */
export const ServiceRejectReasonContent = ({
  value,
}: ServiceRejectReasonContentProps) => {
  const getAllRejectionReasons = () => value?.replaceAll("|", "<br />");

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
      <Typography marginTop={1} variant="body2">
        {value ? (
          <Trans i18nKey="service.rejected.reason.value">
            {getAllRejectionReasons()}
          </Trans>
        ) : null}
      </Typography>
    </DrawerBaseContent>
  );
};
