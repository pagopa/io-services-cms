import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import { useTranslation } from "next-i18next";

interface ApiKeysGroupTagProps {
  disabled?: boolean;
  id?: string;
  /** Tag label text */
  label: string;
  /** If `true`, the text will not wrap, but instead will truncate with a text overflow ellipsis. */
  noWrap?: boolean;
  onClick?: () => void;
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

/** `ApiKeysGroupTag` component */
export const ApiKeysGroupTag = ({
  disabled,
  id,
  label,
  noWrap,
  onClick,
}: ApiKeysGroupTagProps) => {
  const { t } = useTranslation();

  const getNoWrapStyle = () => (noWrap ? ellipsisStyle : {});

  return (
    <Tooltip arrow placement="top" title={noWrap ? t(label) : ""}>
      <Chip
        clickable={!!onClick}
        disabled={disabled}
        key={id}
        label={t(label)}
        onClick={onClick}
        size="small"
        sx={{ ...baseStyle, ...getNoWrapStyle() }}
      />
    </Tooltip>
  );
};
