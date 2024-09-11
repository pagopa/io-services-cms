import { Close } from "@mui/icons-material";
import { IconButton } from "@mui/material";

export interface IconButtonCloseProps {
  onClick: () => void;
}

export const IconButtonClose = ({ onClick }: IconButtonCloseProps) => (
  <IconButton
    aria-label="close-drawer"
    data-testid="bo-io-icon-button-close"
    onClick={onClick}
  >
    <Close />
  </IconButton>
);
