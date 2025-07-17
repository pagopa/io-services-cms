import { Group, StateEnum } from "@/generated/api/Group";
import { Warning } from "@mui/icons-material";
import { useTranslation } from "next-i18next";

import { ApiKeyTag } from "../api-keys/api-key-tag";

interface ServiceGroupTagProps {
  id?: string;
  /** If `true`, the text will not wrap, but instead will truncate with a text overflow ellipsis. */
  noWrap?: boolean;
  value: Group;
}

/** `ApiKeysGroupTag` component */
export const ServiceGroupTag = ({
  id,
  noWrap,
  value,
}: ServiceGroupTagProps) => {
  const { t } = useTranslation();
  const tooltip =
    value.state === StateEnum.SUSPENDED
      ? t("routes.keys.manage.group.state.suspended.tooltip", {
          name: value?.name ?? "",
        })
      : noWrap
        ? (value?.name ?? "")
        : "";
  return (
    <ApiKeyTag
      color={value.state === StateEnum.SUSPENDED ? "warning" : "default"}
      disabled={value.state === StateEnum.DELETED}
      icon={value.state === StateEnum.SUSPENDED ? <Warning /> : undefined}
      id={id}
      label={value.name}
      noWrap={noWrap}
      tooltip={tooltip}
    />
  );
};
