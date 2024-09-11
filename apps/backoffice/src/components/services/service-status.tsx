import { ServiceLifecycleStatus } from "@/generated/api/ServiceLifecycleStatus";
import { ServiceLifecycleStatusTypeEnum } from "@/generated/api/ServiceLifecycleStatusType";
import { Chip } from "@mui/material";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";

import { LoaderSkeleton } from "../loaders";

export interface ServiceStatusProps {
  status?: ServiceLifecycleStatus;
}

/** Render `ServiceLifecycle` **status** as MUI `Chip` component with a particular color based on status value */
export const ServiceStatus = ({ status }: ServiceStatusProps) => {
  const { t } = useTranslation();
  const [color, setColor] = useState<string>("default");
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    switch (status?.value) {
      case ServiceLifecycleStatusTypeEnum.approved:
        setColor("success");
        break;
      case ServiceLifecycleStatusTypeEnum.deleted:
      case ServiceLifecycleStatusTypeEnum.draft:
        setColor("default");
        break;
      case ServiceLifecycleStatusTypeEnum.rejected:
        setColor("error");
        break;
      case ServiceLifecycleStatusTypeEnum.submitted:
        setColor("warning");
        break;
      default:
        setColor("default");
        break;
    }
    setDisabled(status?.value === ServiceLifecycleStatusTypeEnum.deleted);
  }, [status]);

  return (
    <LoaderSkeleton loading={status === undefined} style={{ width: "100%" }}>
      <Chip
        aria-label={status?.value}
        color={color as any}
        disabled={disabled}
        id="service-status"
        label={t(`service.status.${status?.value}`)}
        size="small"
      />
    </LoaderSkeleton>
  );
};
