import { getConfiguration } from "@/config";
import { ServiceLifecycleStatusTypeEnum } from "@/generated/api/ServiceLifecycleStatusType";
import useFetch from "@/hooks/use-fetch";
import { Service } from "@/types/service";
import { hasApiKeyGroupsFeatures } from "@/utils/auth-util";
import {
  trackServiceDetailsEvent,
  trackServiceGroupAssignmentDeleteEvent,
} from "@/utils/mix-panel";
import { ReadMore } from "@mui/icons-material";
import * as tt from "io-ts";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { useState } from "react";

import { ServiceInfoContent, ServiceStatus } from ".";
import { CardDetails, CardRowType } from "../cards";
import { useDrawer } from "../drawer-provider";
import { AssociateGroupToService } from "../groups/associate-group-to-service";
import { GroupInfoTag } from "../groups/group-info-tag";

export interface ServiceInfoProps {
  data?: Service;
  onGroupChange: () => void;
  releaseMode: boolean;
}

const { GROUP_APIKEY_ENABLED } = getConfiguration();

/** Render service basic information card and service details drawer */
export const ServiceInfo = ({
  data,
  onGroupChange,
  releaseMode,
}: ServiceInfoProps) => {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const { openDrawer } = useDrawer();
  const [associateGroupOpen, setAssociateGroupOpen] = useState(false);
  const [isAlreadyGroupBounded, setIsAlreadyGroupBounded] = useState(false);
  const { fetchData: psFetchData } = useFetch<unknown>();

  const handleServiceGroupUnbound = async () => {
    trackServiceGroupAssignmentDeleteEvent();
    await psFetchData(
      "patchService",
      {
        body: {
          metadata: {},
        },
        serviceId: data?.id as string,
      },
      tt.unknown,
      { notify: "all" },
    );
    setIsAlreadyGroupBounded(false);
    onGroupChange();
  };

  const handleAssociateClick = (isAlreadyBounded: boolean) => {
    setIsAlreadyGroupBounded(isAlreadyBounded);
    setAssociateGroupOpen(true);
  };

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
    if (
      hasApiKeyGroupsFeatures(GROUP_APIKEY_ENABLED)(session) &&
      !releaseMode
    ) {
      rowsMin.push({
        label: "routes.service.group.label",
        value: (
          <GroupInfoTag
            loading={!data}
            onAssociateClick={handleAssociateClick}
            onUnboundClick={handleServiceGroupUnbound}
            value={data?.metadata.group}
          />
        ),
      });
    }
    return rowsMin;
  };

  const openDetails = () => {
    trackServiceDetailsEvent(data?.id as string);
    openDrawer(<ServiceInfoContent data={data} />);
  };

  const handleGroupChange = () => {
    setAssociateGroupOpen(false);
    onGroupChange();
  };

  return (
    <>
      <CardDetails
        cta={{
          fn: openDetails,
          icon: <ReadMore style={{ fontSize: "24px" }} />,
          label: "routes.service.viewDetails",
        }}
        rows={buildRowsMin()}
        title="routes.service.information"
      />
      <AssociateGroupToService
        groupId={data?.metadata.group?.id}
        isAlreadyGroupBounded={isAlreadyGroupBounded}
        onClose={() => setAssociateGroupOpen(false)}
        onConfirm={handleGroupChange}
        open={associateGroupOpen}
        service={data ? { id: data.id, name: data.name } : undefined}
      />
    </>
  );
};
