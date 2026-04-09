import { StateEnum as PendingOrErrorState } from "@/generated/api/GetAggregatedInstitutionsKeysDownloadLinkPendingOrError";
import { StateEnum as SuccessState } from "@/generated/api/GetAggregatedInstitutionsKeysDownloadLinkSuccess";
import { Download, RefreshOutlined } from "@mui/icons-material";
import {
  Alert,
  AlertProps,
  AlertTitle,
  Button,
  Typography,
} from "@mui/material";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

export type AggregatedInstitutionDownloadAlertProps = {
  downloadLink?: string;
  expirationDate?: string;
  status?: PendingOrErrorState | SuccessState;
} & {
  onRefresh: () => void;
};

export const AggregatedInstitutionDownloadAlert = ({
  downloadLink,
  expirationDate,
  onRefresh,
  status,
}: AggregatedInstitutionDownloadAlertProps) => {
  const { i18n, t } = useTranslation();

  const alertProps = useMemo<AlertProps | undefined>(() => {
    switch (status) {
      case "DONE":
        return {
          action: (
            <Button
              component="a"
              download="I tuoi enti.json"
              href={downloadLink}
              startIcon={<Download />}
              variant="naked"
            >
              {t("routes.aggregated-institutions.downloadAlert.success.action")}
            </Button>
          ),
          children: (
            <>
              <AlertTitle>
                {t(
                  "routes.aggregated-institutions.downloadAlert.success.title",
                )}
              </AlertTitle>
              <Typography variant="body2">
                {t(
                  "routes.aggregated-institutions.downloadAlert.success.description",
                  {
                    expirationDate: new Intl.DateTimeFormat(i18n.language, {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                    })
                      .format(new Date(expirationDate ?? ""))
                      .replace(/\//g, "-"),
                  },
                )}
              </Typography>
            </>
          ),
          color: "success",
          severity: "success",
        };
      case "IN_PROGRESS":
        return {
          action: (
            <Button
              onClick={onRefresh}
              startIcon={<RefreshOutlined />}
              variant="naked"
            >
              {t(
                "routes.aggregated-institutions.downloadAlert.inProgress.action",
              )}
            </Button>
          ),
          children: (
            <>
              <AlertTitle>
                {t(
                  "routes.aggregated-institutions.downloadAlert.inProgress.title",
                )}
              </AlertTitle>
              <Typography variant="body2">
                {t(
                  "routes.aggregated-institutions.downloadAlert.inProgress.description",
                )}
              </Typography>
            </>
          ),
          color: "info",
          severity: "info",
        };
      case "FAILED":
        return {
          children: (
            <>
              <AlertTitle>
                {t(
                  "routes.aggregated-institutions.downloadAlert.failure.title",
                )}
              </AlertTitle>
              <Typography variant="body2">
                {t(
                  "routes.aggregated-institutions.downloadAlert.failure.description",
                )}
              </Typography>
            </>
          ),
          color: "error",
          severity: "error",
        };
      default:
        break;
    }
  }, [status, downloadLink, expirationDate, i18n.language, t, onRefresh]);

  return (
    alertProps && <Alert elevation={4} variant="outlined" {...alertProps} />
  );
};
