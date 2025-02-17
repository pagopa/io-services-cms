import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import { useTranslation } from "next-i18next";
import { ReactElement } from "react";

interface ApiKeyTagProps {
  color?:
    | "default"
    | "error"
    | "info"
    | "primary"
    | "secondary"
    | "success"
    | "warning";
  disabled?: boolean;
  icon?: ReactElement;
  id?: string;
  label: string;
  /** If `true`, the text will not wrap, but instead will truncate with a text overflow ellipsis. */
  noWrap?: boolean;
  onClick?: () => void;
  tooltip?: string;
}

const baseStyle = {
  borderRadius: 0.5,
  marginBottom: 1,
  marginRight: 1,
};

const ellipsisStyle = {
  "& .MuiChip-label": {
    display: "block",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  maxWidth: "90px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

/** `ApiKeyTag` base component */
export const ApiKeyTag = ({
  color,
  disabled,
  icon,
  id,
  label,
  noWrap,
  onClick,
  tooltip,
}: ApiKeyTagProps) => {
  const { t } = useTranslation();

  const getNoWrapStyle = () => (noWrap ? ellipsisStyle : {});

  return (
    <Tooltip arrow placement="top" title={t(tooltip ?? "")}>
      <Chip
        clickable={!!onClick}
        color={color}
        disabled={disabled}
        icon={icon}
        key={id}
        label={t(label)}
        onClick={onClick}
        size="small"
        sx={{ ...baseStyle, ...getNoWrapStyle() }}
      />
    </Tooltip>
  );
};
