import { Button, Tooltip } from "@mui/material";
import { useTranslation } from "next-i18next";
import React, { ReactNode } from "react";

interface ButtonWithTooltipProps {
  icon: ReactNode;
  isVisible: boolean;
  onClick: () => void;
  size: "large" | "medium" | "small";
  tooltipTitle: string;
  variant: "contained" | "outlined" | "text";
}

export const ButtonWithTooltip = ({
  icon,
  isVisible,
  onClick,
  size,
  tooltipTitle,
  variant,
}: ButtonWithTooltipProps) => {
  const { t } = useTranslation();

  return (
    isVisible && (
      <Tooltip arrow placement="top" title={t(tooltipTitle)}>
        <Button
          data-testid="bo-io-button-with-tooltip"
          onClick={onClick}
          size={size}
          sx={{ bgcolor: "background.paper", padding: 0 }}
          variant={variant}
        >
          {icon}
        </Button>
      </Tooltip>
    )
  );
};
