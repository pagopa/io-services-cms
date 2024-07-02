import { Close } from "@mui/icons-material";
import { IconButton } from "@mui/material";

export type IconButtonCloseProps = { onClick: () => void };

export const IconButtonClose = ({ onClick }: IconButtonCloseProps) => {
  return (
    <IconButton aria-label="close-drawer" onClick={onClick}>
      <Close />
    </IconButton>
  );
};
