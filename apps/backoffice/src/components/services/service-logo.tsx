import { getConfiguration } from "@/config";
import useFetch from "@/hooks/use-fetch";
import { Cancel, CloudDone, CloudUpload } from "@mui/icons-material";
import { Box, Button, LinearProgress, Stack, Typography } from "@mui/material";
import * as tt from "io-ts";
import { Trans, useTranslation } from "next-i18next";
import Image from "next/image";
import { useState } from "react";
import { CardBaseContainer } from "../cards";

export type ServiceLogoProps = {
  serviceId: string;
};

/** Render a card with the service logo and the possibility of uploading/modifying it */
export const ServiceLogo = ({ serviceId }: ServiceLogoProps) => {
  const { t } = useTranslation();
  const configuration = getConfiguration();

  const logoFullPath = `${configuration.CDN_URL}${
    configuration.SERVICES_LOGO_PATH
  }${serviceId?.toLowerCase()}.png`;

  const [logoExists, setLogoExists] = useState(true);
  const [hasPendingLogo, setHasPendingLogo] = useState(false);
  const [logoFile, setLogoFile] = useState<string | ArrayBuffer | null>(
    logoFullPath
  );
  const { loading, fetchData } = useFetch<unknown>();

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
    setLogoFile(logoFullPath);
  };

  const handleUploadServiceLogo = async () => {
    const b64image = logoFile as string;
    const logo = b64image.substring(b64image.indexOf(",") + 1);
    await fetchData(
      "updateServiceLogo",
      { body: { logo: logo as any }, serviceId },
      tt.unknown,
      {
        notify: "all"
      }
    );
    handleCancel();
  };

  const renderSaveButton = () => {
    if (hasPendingLogo)
      return (
        <Button
          variant="text"
          startIcon={<CloudDone />}
          onClick={handleUploadServiceLogo}
        >
          {t("Salva immagine")}
        </Button>
      );
  };

  const renderCancelButton = () => {
    if (hasPendingLogo)
      return (
        <Button
          variant="text"
          color="error"
          startIcon={<Cancel />}
          onClick={handleCancel}
        >
          {t("Annulla")}
        </Button>
      );
  };

  const renderChangeButton = () => {
    if (logoExists && !hasPendingLogo)
      return (
        <Button component="label" variant="text" startIcon={<CloudUpload />}>
          {t("Cambia immagine")}
          <input
            hidden
            accept="image/png"
            type="file"
            onChange={handleImageChanged}
          />
        </Button>
      );
  };

  const renderNoLogo = () => (
    <Box
      padding={3}
      borderRadius={1}
      border="1px dashed #0073E6"
      bgcolor="rgba(0, 115, 230, 0.08)"
    >
      <Box component="label" sx={{ cursor: "pointer" }}>
        <input
          hidden
          accept="image/png"
          type="file"
          onChange={handleImageChanged}
        />
        <Stack direction="column" spacing={1} alignItems="center">
          <CloudUpload color="primary" />
          <Typography variant="body2" color="primary">
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
      src={logoFile as string}
      width={200}
      height={100}
      style={{ objectFit: "scale-down" }}
      alt="service logo"
      unoptimized={true}
      onError={() => setLogoExists(false)}
      onLoadingComplete={() => setLogoExists(true)}
    />
  );

  return (
    <CardBaseContainer>
      <Box textAlign="center">
        {logoExists ? renderLogo() : renderNoLogo()}
        <Stack
          direction="row"
          justifyContent="center"
          alignItems="center"
          spacing={1}
          marginTop={1}
        >
          {loading ? (
            <Box
              display="flex"
              flexDirection="column"
              justifyContent="center"
              sx={{ width: "80%", height: "48px", marginTop: 1 }}
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
          <Typography variant="body2" color="text.secondary">
            <Trans i18nKey="service.logo.disclaimerText" />
          </Typography>
        </Box>
      </Box>
    </CardBaseContainer>
  );
};
