import { ErrorOutline } from "@mui/icons-material";
import { Typography } from "@mui/material";
import { Trans } from "next-i18next";
import { DrawerBaseContent } from "../drawer-provider";

export type ServiceRejectReasonContentProps = {
  value?: string;
};

/** Render service details information */
export const ServiceRejectReasonContent = ({
  value
}: ServiceRejectReasonContentProps) => {
  const getAllRejectionReasons = () => value?.replaceAll("|", "<br />");

  return (
    <DrawerBaseContent
      width="26vw"
      minWidth="320px"
      maxWidth="415px"
      header={{
        startIcon: <ErrorOutline color="error" />,
        title: "service.alerts.rejected.reason.title"
      }}
    >
      <Typography variant="body2" marginTop={1}>
        {value ? (
          <Trans i18nKey="service.rejected.reason.value">
            {getAllRejectionReasons()}
          </Trans>
        ) : null}
      </Typography>
    </DrawerBaseContent>
  );
};
