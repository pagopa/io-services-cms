import ButtonAddRemove from "@/components/buttons/button-add-remove";
import { useDrawer } from "@/components/drawer-provider";
import { Link } from "@mui/icons-material";
import {
  Box,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import { ReactNode, useState } from "react";
import { useFormContext } from "react-hook-form";

import { CTA_PREFIX_URL_SCHEMES } from "./cta-manager/constants";
import { ServiceCtaManager } from "./cta-manager/service-cta-manager";

export type ServiceExtraConfigurationType = "cta" | "fims" | "idpay";

/** Configure extra parameters/configuration for a service _(i.e.: cta, fims protocol, idpay, ...)_ */
export const ServiceExtraConfigurator = () => {
  const { t } = useTranslation();
  const { closeDrawer, openDrawer } = useDrawer();
  const { clearErrors, getValues, setValue, trigger } = useFormContext();
  const [isCtaVisible, setIsCtaVisible] = useState<boolean>(
    getValues("metadata.cta.cta_1.enabled"),
  );

  const handleListItemClick = (type: ServiceExtraConfigurationType) => {
    if (type === "cta") {
      setIsCtaVisible(true);
    }
    closeDrawer();
  };

  const removeCtaConfiguration = () => {
    const emptyCta = {
      enabled: false,
      text: "",
      url: "",
      urlPrefix: CTA_PREFIX_URL_SCHEMES.EXTERNAL,
    };

    setValue("metadata.cta", {
      cta_1: emptyCta,
      cta_2: emptyCta,
    });
    trigger("metadata.cta");
    clearErrors("metadata.cta");
    setIsCtaVisible(false);
  };

  const renderExtraConfigListItem = (options: {
    arriving?: boolean;
    description: string;
    disabled: boolean;
    icon: ReactNode;
    label: string;
    type: ServiceExtraConfigurationType;
  }) => (
    <ListItem disablePadding>
      <ListItemButton
        disabled={options.disabled}
        onClick={() => handleListItemClick(options.type)}
      >
        <ListItemIcon>{options.icon}</ListItemIcon>
        <ListItemText
          primary={
            <Stack alignItems="center" direction="row" spacing={1}>
              <Typography fontWeight={600}>{t(options.label)}</Typography>
              {options.arriving ? (
                <Chip
                  color="info"
                  label={t("forms.service.extraConfig.arriving")}
                  size="small"
                />
              ) : null}
            </Stack>
          }
          secondary={t(options.description)}
        />
      </ListItemButton>
    </ListItem>
  );

  const openExtraConfigurationDrawer = () => {
    const content = (
      <Box width="20vw">
        <Stack direction="row" spacing={1}>
          <Typography variant="h6">
            {t("forms.service.extraConfig.label")}
          </Typography>
        </Stack>
        <Typography marginTop={3} variant="body2">
          {t("forms.service.extraConfig.description")}
        </Typography>
        <List sx={{ marginTop: 3 }}>
          {renderExtraConfigListItem({
            description: "forms.service.extraConfig.cta.description",
            disabled: false,
            icon: <Link />,
            label: "forms.service.extraConfig.cta.label",
            type: "cta",
          })}
          {/*
          // TODO: as we are awaiting official communications, we do not show (even if disabled) extra configurations that are not agreed upon 
          {renderExtraConfigListItem({
            type: "fims",
            disabled: true,
            label: "forms.service.extraConfig.fims.label",
            description: "forms.service.extraConfig.fims.description",
            icon: <VpnKey />,
            arriving: true
          })}
          {renderExtraConfigListItem({
            type: "idpay",
            disabled: true,
            label: "forms.service.extraConfig.idpay.label",
            description: "forms.service.extraConfig.idpay.description",
            icon: <CreditCard />,
            arriving: true
          })} */}
        </List>
      </Box>
    );
    openDrawer(content);
  };

  return (
    <Box marginTop={5}>
      {isCtaVisible ? <ServiceCtaManager /> : null}
      <ButtonAddRemove
        addLabel={t("forms.service.extraConfig.label")}
        kind={isCtaVisible ? "remove" : "add"}
        onAdd={openExtraConfigurationDrawer}
        onRemove={removeCtaConfiguration}
        removeLabel={t("forms.service.extraConfig.remove")}
      />
    </Box>
  );
};
