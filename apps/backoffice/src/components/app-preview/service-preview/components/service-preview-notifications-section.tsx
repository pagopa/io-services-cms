import { Box, List, ListItem, Stack, Switch } from "@mui/material";
import { useTranslation } from "next-i18next";
import { ReactNode, useState } from "react";
import { IOColors, MobileIcon, MobileTypography } from "../../components";
import { ServicePreviewSectionTitle } from "./";

type NotificationType = {
  isVisible: boolean;
  startIcon: ReactNode;
  text: string;
  checked: boolean;
  hideDivider?: boolean;
  onChange?: () => void;
};

const ServicePreviewNotificationsSection = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<NotificationType[]>([
    {
      isVisible: true,
      startIcon: <MobileIcon icon="MobileIconMessage" width={24} height={24} />,
      text: "service.inAppPreview.sections.notifications.notifyLabel",
      checked: true
    },
    {
      isVisible: true,
      startIcon: (
        <MobileIcon icon="MobileIconNotification" width={24} height={24} />
      ),
      text: "service.inAppPreview.sections.notifications.pushLabel",
      checked: true
    },
    {
      isVisible: true,
      startIcon: <MobileIcon icon="MobileIconChecks" width={24} height={14} />,
      text: "service.inAppPreview.sections.notifications.confirmLabel",
      checked: true,
      hideDivider: true
    }
  ]);

  const handleChange = (index: number, checked: boolean) => {
    const updatedNotifications = [...notifications];

    if (index === 0) {
      updatedNotifications[index].checked = checked;
      if (checked) {
        updatedNotifications[1].isVisible = true;
        updatedNotifications[2].isVisible = true;
        updatedNotifications[0].hideDivider = false;
      } else {
        updatedNotifications[1].isVisible = false;
        updatedNotifications[2].isVisible = false;
        updatedNotifications[0].hideDivider = true;
      }
    } else {
      updatedNotifications[index].checked = checked;
    }

    setNotifications(updatedNotifications);
  };

  return (
    <Stack>
      <ServicePreviewSectionTitle
        text={t("service.inAppPreview.sections.notifications.title")}
      />
      <List sx={{ padding: 0 }}>
        {notifications.map(
          (value, index) =>
            value.isVisible && (
              <ListItem
                key={`notification-${index}`}
                sx={{ paddingX: 3, paddingY: 0 }}
              >
                <Box
                  display="flex"
                  flex={1}
                  paddingY={1}
                  borderBottom={
                    value.hideDivider ? "" : `1px solid ${IOColors["grey-100"]}`
                  }
                >
                  <Stack width="100%" flexDirection="row">
                    <Box
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                      fontSize="24px"
                      color={IOColors["grey-650"]}
                      sx={{ opacity: "50%" }}
                    >
                      {value.startIcon}
                    </Box>
                    <Box
                      display="flex"
                      justifyContent="center"
                      flexDirection="column"
                      marginLeft={1.5}
                    >
                      <MobileTypography
                        fontSize={16}
                        fontWeight={600}
                        lineHeight="24px"
                        color={IOColors["grey-850"]}
                      >
                        {t(value.text)}
                      </MobileTypography>
                    </Box>
                    <Box
                      display="flex"
                      flexGrow={1}
                      justifyContent="flex-end"
                      marginRight={-1}
                    >
                      <Switch
                        checked={value.checked}
                        onChange={(_, checked) => handleChange(index, checked)}
                      />
                    </Box>
                  </Stack>
                </Box>
              </ListItem>
            )
        )}
      </List>
    </Stack>
  );
};

export default ServicePreviewNotificationsSection;
