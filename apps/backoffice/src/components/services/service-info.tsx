import { ServiceLifecycleStatusTypeEnum } from "@/generated/api/ServiceLifecycleStatusType";
import { Service } from "@/types/service";
import { ReadMore } from "@mui/icons-material";
import { useTranslation } from "next-i18next";
import { ServiceInfoContent, ServiceStatus } from ".";
import { CardDetails, CardRowType } from "../cards";
import { useDrawer } from "../drawer-provider";
import logToMixpanel from "@/utils/mix-panel";

export type ServiceInfoProps = {
  data?: Service;
};

/** Render service basic information card and service details drawer */
export const ServiceInfo = ({ data }: ServiceInfoProps) => {
  const { t } = useTranslation();
  const { openDrawer } = useDrawer();

  /** row list for minified/basic information card */
  const buildRowsMin = () => {
    const rowsMin: CardRowType[] = [];
    rowsMin.push({
      label: "routes.service.status",
      value: <ServiceStatus status={data?.status} />
    });
    if (data?.status.value === ServiceLifecycleStatusTypeEnum.approved) {
      rowsMin.push({
        label: "routes.service.visibility",
        value: data?.visibility
          ? t(`service.visibility.${data?.visibility}`)
          : undefined
      });
    }
    rowsMin.push(
      {
        label: "routes.service.serviceId",
        value: data?.id
      },
      {
        label: "routes.service.lastUpdate",
        value: data?.lastUpdate,
        kind: "datetime"
      }
    );
    return rowsMin;
  };

  const openDetails = () => {
    logToMixpanel("IO_BO_SERVICE_DETAILS", {
      serviceId: data?.id as string
    });
    openDrawer(<ServiceInfoContent data={data} />);
  };

  return (
    <CardDetails
      title="routes.service.information"
      cta={{
        icon: <ReadMore style={{ fontSize: "24px" }} />,
        label: "routes.service.viewDetails",
        fn: openDetails
      }}
      rows={buildRowsMin()}
    />
  );
};
