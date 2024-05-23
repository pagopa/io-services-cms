import {
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  IconButton
} from "@mui/material";
import { Stack, Box } from "@mui/system";
import { ReactNode } from "react";

type ServicePreviewSectionListItemProps = {
  variant: "link" | "info";
  startIcon: ReactNode;
  endIcon?: ReactNode;
  text: string;
  url?: string;
  label?: string;
  copiable: boolean;
};

const ServicePreviewSectionListItem = ({
  variant,
  startIcon,
  endIcon,
  text,
  url,
  label,
  copiable
}: ServicePreviewSectionListItemProps) => {
  return (
    <>
      {variant === "link" && (
        <ListItemButton
          component="a"
          href={url}
          sx={{ paddingX: "0px" }}
          target="_blank"
        >
          <ListItemIcon>{startIcon}</ListItemIcon>
          <ListItemText style={{ fontSize: "12px" }} primary={text} />
        </ListItemButton>
      )}
      {variant === "info" && (
        <ListItem sx={{ paddingX: "0px" }}>
          <ListItemIcon>{startIcon}</ListItemIcon>
          <ListItemText
            style={{ fontSize: "12px" }}
            primary={text}
            secondary={label}
          />
          {endIcon && <IconButton edge="end">{endIcon}</IconButton>}
        </ListItem>
      )}
    </>
  );
};

export default ServicePreviewSectionListItem;
