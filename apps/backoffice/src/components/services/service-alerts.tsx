import { ServiceLifecycleStatus } from "@/generated/api/ServiceLifecycleStatus";
import { ServiceLifecycleStatusTypeEnum } from "@/generated/api/ServiceLifecycleStatusType";
import { ServicePublicationStatusType } from "@/generated/api/ServicePublicationStatusType";
import { CallSplit } from "@mui/icons-material";
import { Alert, AlertColor, Box, Stack, Typography } from "@mui/material";
import { Trans, useTranslation } from "next-i18next";
import { useEffect, useState } from "react";

import { ServiceRejectReasonContent } from ".";
import { useDrawer } from "../drawer-provider";

type ServiceType = "lifecycle" | "publication";

export interface ServiceAlertsProps {
  onServiceLifecycleClick?: () => void;
  onServicePublicationClick?: () => void;
  /** If `true` shows ServicePublication alerts only */
  releaseMode: boolean;
  serviceLifecycleStatus?: ServiceLifecycleStatus;
  servicePublicationStatus?: ServicePublicationStatusType;
}

/** Render service alerts based on service status and visibility */
export const ServiceAlerts = ({
  onServiceLifecycleClick,
  onServicePublicationClick,
  releaseMode,
  serviceLifecycleStatus,
  servicePublicationStatus,
}: ServiceAlertsProps) => {
  const { t } = useTranslation();
  const { openDrawer } = useDrawer();
  const [currentServiceType, setCurrentServiceType] =
    useState<ServiceType>("lifecycle");

  const renderLifecycleAlert = (
    status: ServiceLifecycleStatus,
    severity: AlertColor,
    message: string,
    cta?: { fn: () => void; label: string },
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
            color="primary.main"
            component="span"
            fontWeight={600}
            onClick={cta.fn}
            sx={{ cursor: "pointer", textDecoration: "underline" }}
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
      iconMapping={{
        info: <CallSplit fontSize="inherit" />,
      }}
      severity="info"
      variant="outlined"
    >
      <Typography variant="body2">
        <span
          dangerouslySetInnerHTML={{
            __html: t(`service.alerts.${currentServiceType}.message`, {
              status: t(`service.status.version.${status.value}`).toLowerCase(),
            }),
          }}
        />{" "}
        <Box
          color="primary.main"
          component="span"
          fontWeight={600}
          onClick={
            releaseMode ? onServicePublicationClick : onServiceLifecycleClick
          }
          sx={{ cursor: "pointer", textDecoration: "underline" }}
        >
          {t(`service.alerts.${currentServiceType}.viewVersion`, {
            rawStatus: t(`service.status.raw.${status.value}`).toLowerCase(),
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
            fn: openRejectionReasonDrawer,
            label: "service.alerts.rejected.reason.label",
          },
        );
      case ServiceLifecycleStatusTypeEnum.submitted:
        return renderLifecycleAlert(
          serviceLifecycleStatus,
          "warning",
          "service.alerts.submitted",
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
    openDrawer(
      <ServiceRejectReasonContent value={serviceLifecycleStatus?.reason} />,
    );
  };

  useEffect(() => {
    setCurrentServiceType(releaseMode ? "publication" : "lifecycle");
  }, [releaseMode]);

  return (
    <Stack direction="column" marginBottom={3} spacing={1}>
      {!releaseMode ? manageLifecycleAlerts() : null}
      {managePublicationAlerts()}
    </Stack>
  );
};
