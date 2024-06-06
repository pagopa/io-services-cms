import { Box, List, ListItem, Switch } from "@mui/material";
import { Stack } from "@mui/system";
import { useTranslation } from "next-i18next";
import { ReactNode, useState } from "react";
import {
  MOBILE_COLOR_GREY_650,
  MOBILE_COLOR_GREY_850,
  MobileTypography
} from "../../components";
import MobileIcon from "../../mobile-icon";
import { ServicePreviewSectionTitle } from "./";

type NotificationType = {
  isVisible: boolean;
  startIcon: ReactNode;
  text: string;
  checked: boolean;
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
      checked: true
    }
  ]);

  const handleChange = (index: number, checked: boolean) => {
    const updatedNotifications = [...notifications];

    if (index === 0) {
      updatedNotifications[index].checked = checked;
      if (checked) {
        updatedNotifications[1].isVisible = true;
        updatedNotifications[2].isVisible = true;
      } else {
        updatedNotifications[1].isVisible = false;
        updatedNotifications[2].isVisible = false;
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
                sx={{ paddingX: 3, paddingY: 1.5 }}
                divider
              >
                <Stack gap={1.5} width="100%" flexDirection="row">
                  <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    fontSize="24px"
                    color={MOBILE_COLOR_GREY_650}
                    sx={{ opacity: "50%" }}
                  >
                    {value.startIcon}
                  </Box>
                  <Box
                    display="flex"
                    justifyContent="center"
                    flexDirection="column"
                  >
                    <MobileTypography
                      fontSize={16}
                      color={MOBILE_COLOR_GREY_850}
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
              </ListItem>
            )
        )}
      </List>
    </Stack>
  );
};

export default ServicePreviewNotificationsSection;
