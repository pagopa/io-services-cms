import { Box, ListItem, ListItemButton, Stack } from "@mui/material";
import { ReactNode } from "react";

import { IOColors, MobileTypography } from "../../components";

export interface ServicePreviewSectionListItemProps {
  endIcon?: ReactNode;
  hideDivider?: boolean;
  isEmail?: boolean;
  isPrimaryValue?: boolean;
  isUrl?: boolean;
  label?: string;
  startIcon: ReactNode;
  value?: string;
  variant: "info" | "link";
}

const ServicePreviewSectionListItem = (
  props: ServicePreviewSectionListItemProps,
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
  hideDivider,
  isEmail,
  isUrl,
  label,
  startIcon,
  value,
}: ServicePreviewSectionListItemProps) => {
  const manageLinkFormat = () =>
    isUrl ? value : isEmail ? `mailto:${value}` : undefined;

  return (
    <ListItemButton
      component="a"
      href={manageLinkFormat()}
      sx={{ paddingX: 3, paddingY: 0 }}
      target="_blank"
    >
      <Box
        borderBottom={manageDivider(hideDivider)}
        display="flex"
        flex={1}
        paddingY={1.5}
      >
        <Stack flexDirection="row" gap={1.5}>
          <Box
            alignItems="center"
            color={IOColors["blueIO-500"]}
            display="flex"
            fontSize="24px"
            justifyContent="center"
            width={24}
          >
            {startIcon}
          </Box>
          <Box display="flex" flexDirection="column" justifyContent="center">
            <MobileTypography
              color={IOColors["blueIO-500"]}
              fontSize={16}
              fontWeight={600}
              lineHeight="20px"
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
  endIcon,
  hideDivider,
  isPrimaryValue,
  label,
  startIcon,
  value,
}: ServicePreviewSectionListItemProps) => (
  <ListItem sx={{ paddingX: 3, paddingY: 0 }}>
    <Box
      borderBottom={manageDivider(hideDivider)}
      display="flex"
      flex={1}
      paddingY={1.5}
    >
      <Stack flexDirection="row" gap={1.5} width="100%">
        <Box
          alignItems="center"
          color={IOColors["grey-300"]}
          display="flex"
          fontSize="24px"
          justifyContent="center"
          width={24}
        >
          {startIcon}
        </Box>
        <Box display="flex" flexDirection="column" justifyContent="center">
          <MobileTypography color={IOColors["grey-700"]} fontSize={14}>
            {label}
          </MobileTypography>
          <MobileTypography
            color={
              isPrimaryValue ? IOColors["blueIO-500"] : IOColors["grey-850"]
            }
            fontSize={16}
            fontWeight={600}
          >
            {value}
          </MobileTypography>
        </Box>
        {endIcon && (
          <Box
            alignItems="center"
            color={IOColors["blueIO-500"]}
            display="flex"
            flexGrow={1}
            justifyContent="flex-end"
          >
            {endIcon}
          </Box>
        )}
      </Stack>
    </Box>
  </ListItem>
);

export default ServicePreviewSectionListItem;
