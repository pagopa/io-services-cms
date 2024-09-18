import { useDrawer } from "@/components/drawer-provider";
import { FormStepSectionWrapper } from "@/components/forms";
import {
  TextFieldController,
  UrlFieldController,
} from "@/components/forms/controllers";
import {
  AddCircleOutline,
  Link,
  RemoveCircleOutline,
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
  Typography,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import { ReactNode, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";

export type ServiceExtraConfigurationType = "cta" | "fims" | "idpay";

/** Configure extra parameters/configuration for a service _(i.e.: cta, fims protocol, idpay, ...)_ */
export const ServiceExtraConfigurator = () => {
  const { t } = useTranslation();
  const { closeDrawer, openDrawer } = useDrawer();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { formState, getValues, setValue } = useFormContext();
  const [isCtaVisible, setIsCtaVisible] = useState(false);

  const handleListItemClick = (type: ServiceExtraConfigurationType) => {
    if (type === "cta") setIsCtaVisible(true);
    closeDrawer();
  };

  const handleRemoveCta = () => {
    setIsCtaVisible(false);
    setValue("metadata.cta.text", "");
    setValue("metadata.cta.url", "");
  };

  const areCtaUrlAndTextEmpty = () =>
    getValues(["metadata.cta.text", "metadata.cta.url"]).filter(
      (value) => value.trim() === "",
    ).length === 2;

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

  const renderCta = () => (
    <FormStepSectionWrapper
      icon={<Link />}
      key={1}
      title={t("forms.service.extraConfig.cta.label")}
    >
      <TextFieldController
        label={t("forms.service.metadata.cta.text.label")}
        name="metadata.cta.text"
        placeholder={t("forms.service.metadata.cta.text.placeholder")}
        required
      />
      <UrlFieldController
        label={t("forms.service.metadata.cta.url.label")}
        name="metadata.cta.url"
        placeholder={t("forms.service.metadata.cta.url.placeholder")}
        required
      />
      <Button
        color="error"
        onClick={handleRemoveCta}
        startIcon={<RemoveCircleOutline />}
        variant="text"
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
        onClick={openExtraConfigurationDrawer}
        startIcon={<AddCircleOutline />}
        variant="text"
      >
        {t("forms.service.extraConfig.label")}
      </Button>
    </Box>
  );
};
