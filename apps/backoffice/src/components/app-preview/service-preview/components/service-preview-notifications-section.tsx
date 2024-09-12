import { Box, List, ListItem, Stack, Switch } from "@mui/material";
import { useTranslation } from "next-i18next";
import { ReactNode, useState } from "react";

import { IOColors, MobileIcon, MobileTypography } from "../../components";
import { ServicePreviewSectionTitle } from "./";

interface NotificationType {
  checked: boolean;
  hideDivider?: boolean;
  isVisible: boolean;
  onChange?: () => void;
  startIcon: ReactNode;
  text: string;
}

const ServicePreviewNotificationsSection = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<NotificationType[]>([
    {
      checked: true,
      isVisible: true,
      startIcon: <MobileIcon height={24} icon="MobileIconMessage" width={24} />,
      text: "service.inAppPreview.sections.notifications.notifyLabel",
    },
    {
      checked: true,
      isVisible: true,
      startIcon: (
        <MobileIcon height={24} icon="MobileIconNotification" width={24} />
      ),
      text: "service.inAppPreview.sections.notifications.pushLabel",
    },
    {
      checked: true,
      hideDivider: true,
      isVisible: true,
      startIcon: <MobileIcon height={14} icon="MobileIconChecks" width={24} />,
      text: "service.inAppPreview.sections.notifications.confirmLabel",
    },
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
                  borderBottom={
                    value.hideDivider ? "" : `1px solid ${IOColors["grey-100"]}`
                  }
                  display="flex"
                  flex={1}
                  paddingY={1}
                >
                  <Stack flexDirection="row" width="100%">
                    <Box
                      alignItems="center"
                      color={IOColors["grey-650"]}
                      display="flex"
                      fontSize="24px"
                      justifyContent="center"
                      sx={{ opacity: "50%" }}
                    >
                      {value.startIcon}
                    </Box>
                    <Box
                      display="flex"
                      flexDirection="column"
                      justifyContent="center"
                      marginLeft={1.5}
                    >
                      <MobileTypography
                        color={IOColors["grey-850"]}
                        fontSize={16}
                        fontWeight={600}
                        lineHeight="24px"
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
            ),
        )}
      </List>
    </Stack>
  );
};

export default ServicePreviewNotificationsSection;
