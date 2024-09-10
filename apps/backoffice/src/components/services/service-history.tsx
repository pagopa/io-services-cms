import { ServiceHistory } from "@/generated/api/ServiceHistory";
import { ServiceHistoryItem } from "@/generated/api/ServiceHistoryItem";
import { ServiceHistoryStatusTypeEnum } from "@/generated/api/ServiceHistoryStatusType";
import { ServiceLifecycle } from "@/generated/api/ServiceLifecycle";
import { ServiceLifecycleStatusTypeEnum } from "@/generated/api/ServiceLifecycleStatusType";
import {
  ArrowForward,
  Check,
  Close,
  Feedback,
  History,
  UnfoldMore,
} from "@mui/icons-material";
import { TimelineConnector } from "@mui/lab";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import {
  ButtonNaked,
  TimelineNotification,
  TimelineNotificationContent,
  TimelineNotificationDot,
  TimelineNotificationItem,
  TimelineNotificationOppositeContent,
  TimelineNotificationSeparator,
} from "@pagopa/mui-italia";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";

import {
  ServiceInfoContent,
  ServiceRejectReasonContent,
  ServiceStatus,
  fromServiceLifecycleToService,
} from ".";
import {
  DrawerBaseContainer,
  DrawerBaseContent,
  useDrawer,
} from "../drawer-provider";

export interface ServiceHistoryComponentProps {
  historyData?: ServiceHistory;
  loading?: boolean;
  onClose: () => void;
  onLoadMoreClick: (continuationToken: string) => void;
  showHistory: boolean;
}

/** Render service history */
// eslint-disable-next-line max-lines-per-function
export const ServiceHistoryComponent = ({
  historyData,
  loading,
  onClose,
  onLoadMoreClick,
  showHistory,
}: ServiceHistoryComponentProps) => {
  const { t } = useTranslation();
  const { openDrawer } = useDrawer();

  const [isDrawerOpen, setIsDrawerOpen] = useState(showHistory);
  const [historyContent, setHistoryContent] = useState<ServiceHistory>({
    items: [],
  });

  const getMonthShort = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { month: "short" };
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("it-IT", options).format(date);
  };

  const getDay = (dateString: string): string => {
    const date = new Date(dateString);
    return ("0" + date.getDate()).slice(-2);
  };

  const getTime = (dateString: string): string => {
    const date = new Date(dateString);
    const hours = ("0" + date.getHours()).slice(-2);
    const minutes = ("0" + date.getMinutes()).slice(-2);
    const seconds = ("0" + date.getSeconds()).slice(-2);
    return `${hours}:${minutes}:${seconds}`;
  };

  function getLifecycleStatusOrNull(
    value: string,
  ): ServiceLifecycleStatusTypeEnum | null {
    return Object.values(ServiceLifecycleStatusTypeEnum).includes(
      value as ServiceLifecycleStatusTypeEnum,
    )
      ? (value as ServiceLifecycleStatusTypeEnum)
      : null;
  }

  const getServiceStatusIcon = (status: ServiceHistoryStatusTypeEnum) => {
    switch (status) {
      case ServiceHistoryStatusTypeEnum.published:
        return (
          <Check
            fontSize="inherit"
            sx={{ color: "text.disabled", marginY: 1 }}
          />
        );
      case ServiceHistoryStatusTypeEnum.unpublished:
        return (
          <Close
            fontSize="inherit"
            sx={{ color: "text.disabled", marginY: 1 }}
          />
        );
      default:
        return <TimelineNotificationDot size="small" variant="filled" />;
    }
  };

  /** Handle close `ServiceHistory` drawer */
  const handleClose = () => {
    onClose();
    setHistoryContent({
      items: [],
    });
  };

  useEffect(() => {
    setHistoryContent((prevHistoryData) => ({
      continuationToken: historyData?.continuationToken,
      items: [
        ...Array.from(prevHistoryData?.items ?? []),
        ...Array.from(historyData?.items ?? []),
      ],
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyData]);

  useEffect(() => {
    setIsDrawerOpen(showHistory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHistory]);

  const renderServiceStatus = (
    item: ServiceHistoryItem,
  ): JSX.Element | null => {
    const status = getLifecycleStatusOrNull(item.status.value);
    return status ? (
      <ServiceStatus
        status={{
          reason: item.status.reason,
          value: status,
        }}
      />
    ) : null;
  };

  const renderHistoryContent = () => (
    <DrawerBaseContent
      header={{
        startIcon: <History color="inherit" />,
        title: "service.history.title",
      }}
      maxWidth="400px"
      minWidth="305px"
      width="25vw"
    >
      <TimelineNotification>
        {historyContent?.items?.map((item, i) => (
          <TimelineNotificationItem key={`service-history-item-${i}`}>
            <TimelineNotificationOppositeContent>
              <Typography
                color="text.secondary"
                component="div"
                variant="caption"
              >
                {getMonthShort(item.last_update).toUpperCase()}
              </Typography>
              <Typography component="div" variant="sidenav">
                {getDay(item.last_update)}
              </Typography>
            </TimelineNotificationOppositeContent>
            <TimelineNotificationSeparator>
              <TimelineConnector />
              {getServiceStatusIcon(item.status.value)}
              <TimelineConnector />
            </TimelineNotificationSeparator>
            <TimelineNotificationContent>
              <Typography
                color="text.secondary"
                component="div"
                variant="caption"
              >
                {getTime(item.last_update)}
              </Typography>

              {renderServiceStatus(item)}

              <Typography
                color="text.primary"
                component="div"
                variant="caption"
              >
                {t(`service.history.status.${item.status.value}`)}
              </Typography>
              {item.status.value === "rejected" ? (
                <ButtonNaked
                  color="primary"
                  onClick={() =>
                    openRejectionReasonDrawer(item.status.reason ?? "")
                  }
                  startIcon={<Feedback />}
                  variant="naked"
                >
                  {t("service.history.readRejectReason")}
                </ButtonNaked>
              ) : null}
              {item.status.value === "draft" ? (
                <ButtonNaked
                  color="primary"
                  endIcon={<ArrowForward />}
                  onClick={() =>
                    openHistoryItemDetailsDrawer({
                      ...item,
                      status: {
                        reason: item.status.reason,
                        value: ServiceLifecycleStatusTypeEnum.draft,
                      },
                    })
                  }
                  variant="naked"
                >
                  {t("routes.service.viewDetails")}
                </ButtonNaked>
              ) : null}
            </TimelineNotificationContent>
          </TimelineNotificationItem>
        ))}
      </TimelineNotification>
      <Box textAlign="center">{renderLoaders()}</Box>
    </DrawerBaseContent>
  );

  /**
   * Render `LoadMore` button in case of history response with continuationToken. \
   * Shows a MUI `CircularProgress` while loading data.
   */
  const renderLoaders = () => {
    if (historyContent.continuationToken) {
      return (
        <Button
          color="primary"
          onClick={() =>
            onLoadMoreClick(historyContent.continuationToken ?? "")
          }
          startIcon={<UnfoldMore />}
          variant="outlined"
        >
          {t("buttons.loadMore")}
        </Button>
      );
    } else if (loading) {
      return (
        <Button
          color="primary"
          startIcon={<CircularProgress size={15} sx={{ marginY: 1 }} />}
          sx={{ cursor: "default", height: 6, padding: 3 }}
          variant="naked"
        >
          {t("loading")}
        </Button>
      );
    }
  };

  const openHistoryItemDetailsDrawer = (historyItem: ServiceLifecycle) => {
    openDrawer(
      <ServiceInfoContent data={fromServiceLifecycleToService(historyItem)} />,
    );
  };

  const openRejectionReasonDrawer = (reason: string) => {
    openDrawer(<ServiceRejectReasonContent value={reason} />);
  };

  return (
    <DrawerBaseContainer onClose={handleClose} open={isDrawerOpen}>
      {renderHistoryContent()}
    </DrawerBaseContainer>
  );
};
