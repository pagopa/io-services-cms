import { ServiceLifecycleStatusTypeEnum } from "@/generated/api/ServiceLifecycleStatusType";
import { Service } from "@/types/service";
import { logToMixpanel } from "@/utils/mix-panel";
import { ReadMore } from "@mui/icons-material";
import { useTranslation } from "next-i18next";

import { ServiceInfoContent, ServiceStatus } from ".";
import { CardDetails, CardRowType } from "../cards";
import { useDrawer } from "../drawer-provider";

export interface ServiceInfoProps {
  data?: Service;
}

/** Render service basic information card and service details drawer */
export const ServiceInfo = ({ data }: ServiceInfoProps) => {
  const { t } = useTranslation();
  const { openDrawer } = useDrawer();

  /** row list for minified/basic information card */
  const buildRowsMin = () => {
    const rowsMin: CardRowType[] = [];
    rowsMin.push({
      label: "routes.service.status",
      value: <ServiceStatus status={data?.status} />,
    });
    if (data?.status.value === ServiceLifecycleStatusTypeEnum.approved) {
      rowsMin.push({
        label: "routes.service.visibility",
        value: data?.visibility
          ? t(`service.visibility.${data?.visibility}`)
          : undefined,
      });
    }
    rowsMin.push(
      {
        label: "routes.service.serviceId",
        value: data?.id,
      },
      {
        kind: "datetime",
        label: "routes.service.lastUpdate",
        value: data?.lastUpdate,
      },
    );
    return rowsMin;
  };

  const openDetails = () => {
    logToMixpanel("IO_BO_SERVICE_DETAILS", "UX", {
      serviceId: data?.id as string,
    });
    openDrawer(<ServiceInfoContent data={data} />);
  };

  return (
    <CardDetails
      cta={{
        fn: openDetails,
        icon: <ReadMore style={{ fontSize: "24px" }} />,
        label: "routes.service.viewDetails",
      }}
      rows={buildRowsMin()}
      title="routes.service.information"
    />
  );
};
