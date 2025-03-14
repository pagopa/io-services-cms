import { StateEnum, Subscription } from "@/generated/api/Subscription";
import { Warning } from "@mui/icons-material";

import { ApiKeyTag } from "../api-key-tag";

interface ApiKeysGroupTagProps {
  disabled?: boolean;
  id?: string;
  /** If `true`, the text will not wrap, but instead will truncate with a text overflow ellipsis. */
  noWrap?: boolean;
  onClick?: () => void;
  value: Subscription;
}

/** `ApiKeysGroupTag` component */
export const ApiKeysGroupTag = ({
  disabled,
  id,
  noWrap,
  onClick,
  value,
}: ApiKeysGroupTagProps) => {
  const shouldBeDisabled = () =>
    value.state !== StateEnum.active && value.state !== StateEnum.suspended;

  const handleOnClick = () =>
    !shouldBeDisabled() && onClick ? onClick() : undefined;

  return (
    <ApiKeyTag
      color={value.state === StateEnum.suspended ? "warning" : "default"}
      disabled={disabled || shouldBeDisabled()}
      icon={value.state === StateEnum.suspended ? <Warning /> : undefined}
      id={id}
      label={value.name}
      noWrap={noWrap}
      onClick={handleOnClick}
      tooltip={
        value.state === StateEnum.suspended
          ? "routes.keys.manage.group.state.suspended.tooltip"
          : noWrap
            ? value.name
            : ""
      }
    />
  );
};
