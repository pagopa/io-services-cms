import { Box, ListItem, ListItemButton, Stack } from "@mui/material";
import { ReactNode } from "react";
import { IOColors, MobileTypography } from "../../components";

export type ServicePreviewSectionListItemProps = {
  variant: "link" | "info";
  startIcon: ReactNode;
  endIcon?: ReactNode;
  value?: string;
  isPrimaryValue?: boolean;
  label?: string;
  isUrl?: boolean;
  isEmail?: boolean;
  hideDivider?: boolean;
};

const ServicePreviewSectionListItem = (
  props: ServicePreviewSectionListItemProps
) => {
  if (!props.value) {
    return <></>;
  }

  return (
    <>
      {props.variant === "link" && (
        <ServicePreviewSectionListItemLink {...props} />
      )}
      {props.variant === "info" && (
        <ServicePreviewSectionListItemInfo {...props} />
      )}
    </>
  );
};

const manageDivider = (hideDivider?: boolean) =>
  hideDivider ? "" : `1px solid ${IOColors["grey-100"]}`;

const ServicePreviewSectionListItemLink = ({
  startIcon,
  value,
  label,
  isUrl,
  isEmail,
  hideDivider
}: ServicePreviewSectionListItemProps) => {
  const manageLinkFormat = () =>
    isUrl ? value : isEmail ? `mailto:${value}` : undefined;

  return (
    <ListItemButton
      component="a"
      href={manageLinkFormat()}
      target="_blank"
      sx={{ paddingX: 3, paddingY: 0 }}
    >
      <Box
        display="flex"
        flex={1}
        paddingY={1.5}
        borderBottom={manageDivider(hideDivider)}
      >
        <Stack gap={1.5} flexDirection="row">
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            width={24}
            fontSize="24px"
            color={IOColors["blueIO-500"]}
          >
            {startIcon}
          </Box>
          <Box display="flex" justifyContent="center" flexDirection="column">
            <MobileTypography
              fontSize={16}
              fontWeight={600}
              lineHeight="20px"
              color={IOColors["blueIO-500"]}
            >
              {label}
            </MobileTypography>
          </Box>
        </Stack>
      </Box>
    </ListItemButton>
  );
};

const ServicePreviewSectionListItemInfo = ({
  startIcon,
  endIcon,
  value,
  isPrimaryValue,
  label,
  hideDivider
}: ServicePreviewSectionListItemProps) => {
  return (
    <ListItem sx={{ paddingX: 3, paddingY: 0 }}>
      <Box
        display="flex"
        flex={1}
        paddingY={1.5}
        borderBottom={manageDivider(hideDivider)}
      >
        <Stack gap={1.5} flexDirection="row" width="100%">
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            width={24}
            fontSize="24px"
            color={IOColors["grey-300"]}
          >
            {startIcon}
          </Box>
          <Box display="flex" justifyContent="center" flexDirection="column">
            <MobileTypography fontSize={14} color={IOColors["grey-700"]}>
              {label}
            </MobileTypography>
            <MobileTypography
              fontSize={16}
              fontWeight={600}
              color={
                isPrimaryValue ? IOColors["blueIO-500"] : IOColors["grey-850"]
              }
            >
              {value}
            </MobileTypography>
          </Box>
          {endIcon && (
            <Box
              display="flex"
              flexGrow={1}
              justifyContent="flex-end"
              alignItems="center"
              color={IOColors["blueIO-500"]}
            >
              {endIcon}
            </Box>
          )}
        </Stack>
      </Box>
    </ListItem>
  );
};

export default ServicePreviewSectionListItem;
