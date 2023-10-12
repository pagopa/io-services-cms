import { ServiceLifecycleStatus } from "@/generated/api/ServiceLifecycleStatus";
import { ServiceLifecycleStatusTypeEnum } from "@/generated/api/ServiceLifecycleStatusType";
import { ServicePublicationStatusType } from "@/generated/api/ServicePublicationStatusType";
import { CallSplit, ErrorOutline } from "@mui/icons-material";
import { Alert, AlertColor, Box, Stack, Typography } from "@mui/material";
import { Trans, useTranslation } from "next-i18next";
import { useEffect, useState } from "react";
import { useDrawer } from "../drawer-provider";

type ServiceType = "lifecycle" | "publication";

export type ServiceAlertsProps = {
  /** If `true` shows ServicePublication alerts only */
  releaseMode: boolean;
  serviceLifecycleStatus?: ServiceLifecycleStatus;
  servicePublicationStatus?: ServicePublicationStatusType;
  onServiceLifecycleClick?: () => void;
  onServicePublicationClick?: () => void;
};

/** Render service alerts based on service status and visibility */
export const ServiceAlerts = ({
  releaseMode,
  serviceLifecycleStatus,
  servicePublicationStatus,
  onServiceLifecycleClick,
  onServicePublicationClick
}: ServiceAlertsProps) => {
  const { t } = useTranslation();
  const { openDrawer } = useDrawer();
  const [currentServiceType, setCurrentServiceType] = useState<ServiceType>(
    "lifecycle"
  );

  const renderLifecycleAlert = (
    status: ServiceLifecycleStatus,
    severity: AlertColor,
    message: string,
    cta?: { label: string; fn: () => void }
  ) => (
    <Alert
      aria-label={`sl-alert-${status.value}`}
      severity={severity}
      variant="outlined"
    >
      <Typography variant="body2">
        <Trans i18nKey={message} />{" "}
        {cta ? (
          <Box
            component="span"
            onClick={cta.fn}
            color="primary.main"
            sx={{ textDecoration: "underline", cursor: "pointer" }}
            fontWeight={600}
          >
            {t(cta.label)}
          </Box>
        ) : null}
      </Typography>
    </Alert>
  );

  const renderPublicationAlert = (status: ServiceLifecycleStatus) => (
    <Alert
      aria-label={`sp-alert`}
      severity="info"
      variant="outlined"
      iconMapping={{
        info: <CallSplit fontSize="inherit" />
      }}
    >
      <Typography variant="body2">
        <span
          dangerouslySetInnerHTML={{
            __html: t(`service.alerts.${currentServiceType}.message`, {
              status: t(`service.status.version.${status.value}`).toLowerCase()
            })
          }}
        />{" "}
        <Box
          component="span"
          onClick={
            releaseMode ? onServicePublicationClick : onServiceLifecycleClick
          }
          color="primary.main"
          sx={{ textDecoration: "underline", cursor: "pointer" }}
          fontWeight={600}
        >
          {t(`service.alerts.${currentServiceType}.viewVersion`, {
            rawStatus: t(`service.status.raw.${status.value}`).toLowerCase()
          })}
        </Box>
      </Typography>
    </Alert>
  );

  /** Check conditions to render service lifecycle alerts */
  const manageLifecycleAlerts = () => {
    switch (serviceLifecycleStatus?.value) {
      case ServiceLifecycleStatusTypeEnum.rejected:
        return renderLifecycleAlert(
          serviceLifecycleStatus,
          "error",
          "service.alerts.rejected.message",
          {
            label: "service.alerts.rejected.reason.label",
            fn: openRejectionReasonDrawer
          }
        );
      case ServiceLifecycleStatusTypeEnum.submitted:
        return renderLifecycleAlert(
          serviceLifecycleStatus,
          "warning",
          "service.alerts.submitted"
        );
      default:
        break;
    }
  };

  /** Check conditions to render service publication alerts */
  const managePublicationAlerts = () => {
    if (
      serviceLifecycleStatus &&
      serviceLifecycleStatus.value !==
        ServiceLifecycleStatusTypeEnum.approved &&
      servicePublicationStatus
    ) {
      return renderPublicationAlert(serviceLifecycleStatus);
    }
  };

  const openRejectionReasonDrawer = () => {
    const content = (
      <Box width="20vw">
        <Stack direction="row" spacing={1}>
          <ErrorOutline color="error" />
          <Typography variant="h6">
            {t("service.alerts.rejected.reason.title")}
          </Typography>
        </Stack>
        <Typography variant="body2" marginTop={1}>
          {serviceLifecycleStatus?.reason}
        </Typography>
      </Box>
    );
    openDrawer(content);
  };

  useEffect(() => {
    setCurrentServiceType(releaseMode ? "publication" : "lifecycle");
  }, [releaseMode]);

  return (
    <Stack direction="column" spacing={1} marginBottom={3}>
      {!releaseMode ? manageLifecycleAlerts() : null}
      {managePublicationAlerts()}
    </Stack>
  );
};
