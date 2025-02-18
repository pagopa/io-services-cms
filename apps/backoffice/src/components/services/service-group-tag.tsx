import { Group, StateEnum } from "@/generated/api/Group";
import { Warning } from "@mui/icons-material";

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
}: ServiceGroupTagProps) => (
  <ApiKeyTag
    color={value.state === StateEnum.SUSPENDED ? "warning" : "default"}
    disabled={value.state === StateEnum.DELETED}
    icon={value.state === StateEnum.SUSPENDED ? <Warning /> : undefined}
    id={id}
    label={value.name}
    noWrap={noWrap}
    tooltip={
      value.state === StateEnum.SUSPENDED
        ? "routes.keys.groups.state.suspended.tooltip"
        : noWrap
          ? value.name
          : ""
    }
  />
);
