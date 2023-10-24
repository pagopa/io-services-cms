import { useDrawer } from "@/components/drawer-provider";
import { FormStepSectionWrapper } from "@/components/forms";
import {
  TextFieldController,
  UrlFieldController
} from "@/components/forms/controllers";
import {
  AddBox,
  AddCircleOutline,
  CreditCard,
  RemoveCircleOutline,
  VpnKey
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography
} from "@mui/material";
import { useTranslation } from "next-i18next";
import { ReactNode, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";

export type ServiceExtraConfigurationType = "cta" | "fims" | "idpay";

/** Configure extra parameters/configuration for a service _(i.e.: cta, fims protocol, idpay, ...)_ */
export const ServiceExtraConfigurator = () => {
  const { t } = useTranslation();
  const { openDrawer, closeDrawer } = useDrawer();
  const { resetField, formState, getValues } = useFormContext();
  const [isCtaVisible, setIsCtaVisible] = useState(false);

  const handleListItemClick = (type: ServiceExtraConfigurationType) => {
    if (type === "cta") setIsCtaVisible(true);
    closeDrawer();
  };

  const handleRemoveCta = () => {
    setIsCtaVisible(false);
    resetField("metadata.cta.text");
    resetField("metadata.cta.url");
  };

  const areCtaUrlAndTextEmpty = () =>
    getValues(["metadata.cta.text", "metadata.cta.url"]).filter(
      value => value.trim() === ""
    ).length === 2;

  const renderExtraConfigListItem = (options: {
    type: ServiceExtraConfigurationType;
    disabled: boolean;
    label: string;
    description: string;
    icon: ReactNode;
    arriving?: boolean;
  }) => (
    <ListItem disablePadding>
      <ListItemButton
        disabled={options.disabled}
        onClick={() => handleListItemClick(options.type)}
      >
        <ListItemIcon>{options.icon}</ListItemIcon>
        <ListItemText
          primary={
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography fontWeight={600}>{t(options.label)}</Typography>
              {options.arriving ? (
                <Chip
                  size="small"
                  label={t("forms.service.extraConfig.arriving")}
                  color="info"
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
        <Typography variant="body2" marginTop={3}>
          {t("forms.service.extraConfig.description")}
        </Typography>
        <List sx={{ marginTop: 3 }}>
          {renderExtraConfigListItem({
            type: "cta",
            disabled: false,
            label: "forms.service.extraConfig.cta.label",
            description: "forms.service.extraConfig.cta.description",
            icon: <AddBox />
          })}
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
          })}
        </List>
      </Box>
    );
    openDrawer(content);
  };

  const renderCta = () => (
    <FormStepSectionWrapper
      key={1}
      title={t("forms.service.extraConfig.cta.label")}
      icon={<AddBox />}
    >
      <TextFieldController
        required
        name="metadata.cta.text"
        label={t("forms.service.metadata.cta.text.label")}
        placeholder={t("forms.service.metadata.cta.text.placeholder")}
      />
      <UrlFieldController
        required
        name="metadata.cta.url"
        label={t("forms.service.metadata.cta.url.label")}
        placeholder={t("forms.service.metadata.cta.url.placeholder")}
      />
      <Button
        variant="text"
        startIcon={<RemoveCircleOutline />}
        color="error"
        onClick={handleRemoveCta}
      >
        {t("forms.service.extraConfig.remove")}
      </Button>
    </FormStepSectionWrapper>
  );

  useEffect(() => {
    setIsCtaVisible(!areCtaUrlAndTextEmpty());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box marginTop={5}>
      {isCtaVisible ? renderCta() : null}
      <Button
        variant="text"
        startIcon={<AddCircleOutline />}
        onClick={openExtraConfigurationDrawer}
      >
        {t("forms.service.extraConfig.label")}
      </Button>
    </Box>
  );
};
