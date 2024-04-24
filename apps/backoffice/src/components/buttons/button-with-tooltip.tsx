import { Button, Tooltip } from "@mui/material";
import React, { ReactNode } from "react";
import { useTranslation } from "next-i18next";

type ButtonWithTooltipProps = {
  tooltipTitle: string;
  handleOnClick: () => void;
  icon: ReactNode;
  size: "small" | "medium" | "large";
  variant: "text" | "outlined" | "contained";
  isVisible: boolean;
};

const ButtonWithTooltip = ({
  tooltipTitle,
  handleOnClick,
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
          size={size}
          variant={variant}
          sx={{ bgcolor: "background.paper", padding: 0 }}
          onClick={handleOnClick}
        >
          {icon}
        </Button>
      </Tooltip>
    )
  );
};

export default ButtonWithTooltip;
