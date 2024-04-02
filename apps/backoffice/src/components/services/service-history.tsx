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
  UnfoldMore
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
  TimelineNotificationSeparator
} from "@pagopa/mui-italia";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";
import {
  ServiceInfoContent,
  ServiceRejectReasonContent,
  ServiceStatus,
  fromServiceLifecycleToService
} from ".";
import {
  DrawerBaseContainer,
  DrawerBaseContent,
  useDrawer
} from "../drawer-provider";

export type ServiceHistoryComponentProps = {
  historyData?: ServiceHistory;
  showHistory: boolean;
  loading?: boolean;
  onLoadMoreClick: (continuationToken: string) => void;
  onClose: () => void;
};

/** Render service history */
export const ServiceHistoryComponent = ({
  historyData,
  showHistory,
  loading,
  onLoadMoreClick,
  onClose
}: ServiceHistoryComponentProps) => {
  const { t } = useTranslation();
  const { openDrawer } = useDrawer();

  const [isDrawerOpen, setIsDrawerOpen] = useState(showHistory);
  const [historyContent, setHistoryContent] = useState<ServiceHistory>({
    items: []
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
    value: string
  ): ServiceLifecycleStatusTypeEnum | null {
    return Object.values(ServiceLifecycleStatusTypeEnum).includes(
      value as ServiceLifecycleStatusTypeEnum
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
        return <TimelineNotificationDot variant="filled" size="small" />;
    }
  };

  /** Handle close `ServiceHistory` drawer */
  const handleClose = () => {
    onClose();
    setHistoryContent({
      items: []
    });
  };

  useEffect(() => {
    setHistoryContent(prevHistoryData => ({
      continuationToken: historyData?.continuationToken,
      items: [
        ...Array.from(prevHistoryData?.items ?? []),
        ...Array.from(historyData?.items ?? [])
      ]
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyData]);

  useEffect(() => {
    setIsDrawerOpen(showHistory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHistory]);

  const renderServiceStatus = (
    item: ServiceHistoryItem
  ): JSX.Element | null => {
    const status = getLifecycleStatusOrNull(item.status.value);
    return status ? (
      <ServiceStatus
        status={{
          value: status,
          reason: item.status.reason
        }}
      />
    ) : null;
  };

  const renderHistoryContent = () => (
    <DrawerBaseContent
      width="25vw"
      minWidth="305px"
      maxWidth="400px"
      header={{
        startIcon: <History color="inherit" />,
        title: "service.history.title"
      }}
    >
      <TimelineNotification>
        {historyContent?.items?.map((item, i) => (
          <TimelineNotificationItem key={`service-history-item-${i}`}>
            <TimelineNotificationOppositeContent>
              <Typography
                color="text.secondary"
                variant="caption"
                component="div"
              >
                {getMonthShort(item.last_update).toUpperCase()}
              </Typography>
              <Typography variant="sidenav" component="div">
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
                variant="caption"
                color="text.secondary"
                component="div"
              >
                {getTime(item.last_update)}
              </Typography>

              {renderServiceStatus(item)}

              <Typography
                color="text.primary"
                variant="caption"
                component="div"
              >
                {t(`service.history.status.${item.status.value}`)}
              </Typography>
              {item.status.value === "rejected" ? (
                <ButtonNaked
                  variant="naked"
                  color="primary"
                  startIcon={<Feedback />}
                  onClick={() =>
                    openRejectionReasonDrawer(item.status.reason ?? "")
                  }
                >
                  {t("service.history.readRejectReason")}
                </ButtonNaked>
              ) : null}
              {item.status.value === "draft" ? (
                <ButtonNaked
                  variant="naked"
                  color="primary"
                  endIcon={<ArrowForward />}
                  onClick={() =>
                    openHistoryItemDetailsDrawer({
                      ...item,
                      status: {
                        value: ServiceLifecycleStatusTypeEnum.draft,
                        reason: item.status.reason
                      }
                    })
                  }
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
          startIcon={<UnfoldMore />}
          color="primary"
          variant="outlined"
          onClick={() =>
            onLoadMoreClick(historyContent.continuationToken ?? "")
          }
        >
          {t("buttons.loadMore")}
        </Button>
      );
    } else if (loading) {
      return (
        <Button
          startIcon={<CircularProgress size={15} sx={{ marginY: 1 }} />}
          color="primary"
          variant="naked"
          sx={{ cursor: "default", height: 6, padding: 3 }}
        >
          {t("loading")}
        </Button>
      );
    }
  };

  const openHistoryItemDetailsDrawer = (historyItem: ServiceLifecycle) => {
    openDrawer(
      <ServiceInfoContent data={fromServiceLifecycleToService(historyItem)} />
    );
  };

  const openRejectionReasonDrawer = (reason: string) => {
    openDrawer(<ServiceRejectReasonContent value={reason} />);
  };

  return (
    <DrawerBaseContainer open={isDrawerOpen} onClose={handleClose}>
      {renderHistoryContent()}
    </DrawerBaseContainer>
  );
};
