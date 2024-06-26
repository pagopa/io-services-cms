import { Button, Tooltip } from "@mui/material";
import React, { ReactNode } from "react";
import { useTranslation } from "next-i18next";

type ButtonWithTooltipProps = {
  tooltipTitle: string;
  onClick: () => void;
  icon: ReactNode;
  size: "small" | "medium" | "large";
  variant: "text" | "outlined" | "contained";
  isVisible: boolean;
};

export const ButtonWithTooltip = ({
  tooltipTitle,
  onClick,
  icon,
  size,
  variant,
  isVisible
}: ButtonWithTooltipProps) => {
  const { t } = useTranslation();

  return (
    isVisible && (
      <Tooltip title={t(tooltipTitle)} placement="top" arrow>
        <Button
          data-testid="bo-io-button-with-tooltip"
          size={size}
          variant={variant}
          sx={{ bgcolor: "background.paper", padding: 0 }}
          onClick={onClick}
        >
          {icon}
        </Button>
      </Tooltip>
    )
  );
};
