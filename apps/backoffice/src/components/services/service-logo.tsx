import { getConfiguration } from "@/config";
import useFetch from "@/hooks/use-fetch";
import { Cancel, CloudDone, CloudUpload } from "@mui/icons-material";
import { Box, Button, LinearProgress, Stack, Typography } from "@mui/material";
import * as tt from "io-ts";
import Image from "next/image";
import { Trans, useTranslation } from "next-i18next";
import { useState } from "react";

import { CardBaseContainer } from "../cards";

export interface ServiceLogoProps {
  serviceId: string;
}

/** Render a card with the service logo and the possibility of uploading/modifying it */
export const ServiceLogo = ({ serviceId }: ServiceLogoProps) => {
  const { t } = useTranslation();
  const configuration = getConfiguration();

  const logoFullPath = () =>
    `${configuration.CDN_URL}${
      configuration.SERVICES_LOGO_PATH
    }${serviceId?.toLowerCase()}.png?${Date.now()}`;

  const [logoExists, setLogoExists] = useState(true);
  const [hasPendingLogo, setHasPendingLogo] = useState(false);
  const [logoFile, setLogoFile] = useState<ArrayBuffer | null | string>(
    logoFullPath(),
  );
  const { fetchData, loading } = useFetch<unknown>();

  /** handle file read after file selection */
  const handleImageChanged = (event: any) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onloadend = () => {
      setLogoFile(reader.result as string);
      setHasPendingLogo(true);
      setLogoExists(true);
    };
    if (file instanceof Blob) reader.readAsDataURL(file);
  };

  const handleCancel = () => {
    setHasPendingLogo(false);
    setLogoFile(logoFullPath());
  };

  const handleUploadServiceLogo = async () => {
    const b64image = logoFile as string;
    const logo = b64image.substring(b64image.indexOf(",") + 1);
    await fetchData(
      "updateServiceLogo",
      { body: { logo: logo as any }, serviceId },
      tt.unknown,
      {
        notify: "all",
      },
    );
    handleCancel();
  };

  const renderSaveButton = () => {
    if (hasPendingLogo)
      return (
        <Button
          onClick={handleUploadServiceLogo}
          startIcon={<CloudDone />}
          variant="text"
        >
          {t("Salva immagine")}
        </Button>
      );
  };

  const renderCancelButton = () => {
    if (hasPendingLogo)
      return (
        <Button
          color="error"
          onClick={handleCancel}
          startIcon={<Cancel />}
          variant="text"
        >
          {t("Annulla")}
        </Button>
      );
  };

  const renderChangeButton = () => {
    if (logoExists && !hasPendingLogo)
      return (
        <Button component="label" startIcon={<CloudUpload />} variant="text">
          {t("Cambia immagine")}
          <input
            accept="image/png"
            hidden
            onChange={handleImageChanged}
            type="file"
          />
        </Button>
      );
  };

  const renderNoLogo = () => (
    <Box
      bgcolor="rgba(0, 115, 230, 0.08)"
      border="1px dashed #0073E6"
      borderRadius={1}
      padding={3}
    >
      <Box component="label" sx={{ cursor: "pointer" }}>
        <input
          accept="image/png"
          hidden
          onChange={handleImageChanged}
          type="file"
        />
        <Stack alignItems="center" direction="column" spacing={1}>
          <CloudUpload color="primary" />
          <Typography color="primary" variant="body2">
            {t("service.logo.dropzoneText")}
          </Typography>
          <Typography fontSize={12}>
            <Trans i18nKey="service.logo.sizeFormatText" />
          </Typography>
        </Stack>
      </Box>
    </Box>
  );

  const renderLogo = () => (
    <Image
      alt="service logo"
      height={100}
      onError={() => setLogoExists(false)}
      onLoadingComplete={() => setLogoExists(true)}
      src={logoFile as string}
      style={{ objectFit: "scale-down" }}
      unoptimized={true}
      width={200}
    />
  );

  return (
    <CardBaseContainer>
      <Box textAlign="center">
        {logoExists ? renderLogo() : renderNoLogo()}
        <Stack
          alignItems="center"
          direction="row"
          justifyContent="center"
          marginTop={1}
          spacing={1}
        >
          {loading ? (
            <Box
              display="flex"
              flexDirection="column"
              justifyContent="center"
              sx={{ height: "48px", marginTop: 1, width: "80%" }}
            >
              <LinearProgress />
            </Box>
          ) : (
            <>
              {renderCancelButton()}
              {renderSaveButton()}
              {renderChangeButton()}
            </>
          )}
        </Stack>
        <Box marginTop={1}>
          <Typography color="text.secondary" variant="body2">
            <Trans i18nKey="service.logo.disclaimerText" />
          </Typography>
        </Box>
      </Box>
    </CardBaseContainer>
  );
};
