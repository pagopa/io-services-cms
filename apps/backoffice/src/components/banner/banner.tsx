import { Alert, AlertColor, AlertTitle } from "@mui/material";

import { MarkdownView } from "../markdown-view";

export interface BannerProps {
  description?: string;
  severity: AlertColor;
  title?: string;
}

export const Banner = ({ description, severity, title }: BannerProps) => (
  <Alert
    className="banner"
    severity={severity}
    sx={{ marginBottom: 1.5 }}
    variant="standard"
  >
    <AlertTitle>{title}</AlertTitle>
    <MarkdownView>{description}</MarkdownView>
  </Alert>
);
