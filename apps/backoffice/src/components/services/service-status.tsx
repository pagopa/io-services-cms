import { ServiceLifecycleStatus } from "@/generated/api/ServiceLifecycleStatus";
import { ServiceLifecycleStatusTypeEnum } from "@/generated/api/ServiceLifecycleStatusType";
import { Chip } from "@mui/material";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";
import { LoaderSkeleton } from "../loaders";

export type ServiceStatusProps = {
  status?: ServiceLifecycleStatus;
};

/** Render `ServiceLifecycle` **status** as MUI `Chip` component with a particular color based on status value */
export const ServiceStatus = ({ status }: ServiceStatusProps) => {
  const { t } = useTranslation();
  const [color, setColor] = useState<string>("default");

  useEffect(() => {
    switch (status?.value) {
      case ServiceLifecycleStatusTypeEnum.approved:
        setColor("success");
        break;
      case ServiceLifecycleStatusTypeEnum.deleted:
        setColor("error");
        break;
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
  }, [status]);

  return (
    <LoaderSkeleton loading={status === undefined} style={{ width: "100%" }}>
      <Chip
        id="service-status"
        aria-label={status?.value}
        label={t(`service.status.${status?.value}`)}
        size="small"
        color={color as any}
      />
    </LoaderSkeleton>
  );
};
