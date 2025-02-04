import { getConfiguration } from "@/config";
import { ServiceLifecycleStatusTypeEnum } from "@/generated/api/ServiceLifecycleStatusType";
import { Service } from "@/types/service";
import { trackServiceDetailsEvent } from "@/utils/mix-panel";
import { ReadMore } from "@mui/icons-material";
import { useTranslation } from "next-i18next";

import { ServiceInfoContent, ServiceStatus } from ".";
import { CardDetails, CardRowType } from "../cards";
import { useDrawer } from "../drawer-provider";

export interface ServiceInfoProps {
  data?: Service;
  releaseMode: boolean;
}

const { GROUP_APIKEY_ENABLED } = getConfiguration();

/** Render service basic information card and service details drawer */
export const ServiceInfo = ({ data, releaseMode }: ServiceInfoProps) => {
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
    if (GROUP_APIKEY_ENABLED && !releaseMode) {
      rowsMin.push({
        label: "routes.service.group.label",
        value:
          data?.metadata.group?.name ?? t("routes.service.group.unbounded"),
      });
    }
    return rowsMin;
  };

  const openDetails = () => {
    trackServiceDetailsEvent(data?.id as string);

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
