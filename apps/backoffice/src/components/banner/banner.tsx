import { Alert, AlertColor, AlertTitle } from "@mui/material";
import { ReactElement } from "react";

import { MarkdownView } from "../markdown-view";

export interface BannerProps {
  description?: string;
  icon?: ReactElement;
  severity: AlertColor;
  title?: string;
}

export const Banner = ({ description, icon, severity, title }: BannerProps) => (
  <Alert
    className="banner"
    icon={icon}
    severity={severity}
    sx={{ marginBottom: 1.5 }}
    variant="standard"
  >
    <AlertTitle>{title}</AlertTitle>
    <MarkdownView>{description}</MarkdownView>
  </Alert>
);
