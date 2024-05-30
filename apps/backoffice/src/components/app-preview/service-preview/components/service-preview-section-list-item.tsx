import {
  Box,
  IconButton,
  ListItem,
  ListItemButton,
  Stack
} from "@mui/material";
import { ReactNode } from "react";
import {
  MOBILE_COLOR_BLUE_IO_500,
  MOBILE_COLOR_GREY_300,
  MOBILE_COLOR_GREY_700,
  MOBILE_COLOR_GREY_850,
  MobileTypography
} from "../../components";

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
          target="_blank"
          sx={{ paddingX: 3, paddingY: 1.5 }}
          divider
        >
          <Stack gap={1.5} flexDirection="row">
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              width={24}
              fontSize="24px"
              color={MOBILE_COLOR_BLUE_IO_500}
            >
              {startIcon}
            </Box>
            <Box display="flex" justifyContent="center" flexDirection="column">
              <MobileTypography fontSize={16} color={MOBILE_COLOR_BLUE_IO_500}>
                {text}
              </MobileTypography>
            </Box>
          </Stack>
        </ListItemButton>
      )}
      {variant === "info" && (
        <ListItem sx={{ paddingX: 3, paddingY: 1.5 }} divider>
          <Stack gap={1.5} flexDirection="row" width="100%">
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              width={24}
              fontSize="24px"
              color={MOBILE_COLOR_GREY_300}
            >
              {startIcon}
            </Box>
            <Box display="flex" justifyContent="center" flexDirection="column">
              <MobileTypography fontSize={14} color={MOBILE_COLOR_GREY_700}>
                {text}
              </MobileTypography>
              <MobileTypography fontSize={16} color={MOBILE_COLOR_GREY_850}>
                {label}
              </MobileTypography>
            </Box>
            <Box
              display="flex"
              flexGrow={1}
              justifyContent="flex-end"
              color={MOBILE_COLOR_BLUE_IO_500}
            >
              {endIcon && (
                <IconButton edge="end" color="inherit">
                  {endIcon}
                </IconButton>
              )}
            </Box>
          </Stack>
        </ListItem>
      )}
    </>
  );
};

export default ServicePreviewSectionListItem;
