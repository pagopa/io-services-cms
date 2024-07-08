import { getConfiguration } from "@/config";
import { AccountBalanceRounded } from "@mui/icons-material";
import { Box } from "@mui/material";
import Image from "next/image";
import React, { useState } from "react";
import { IOColors } from ".";

const LOGO_SIZE = 48;

export type AvatarLogoProps = {
  organizationFiscalCode: string;
  serviceId: string;
};

/** Render rounded box with service/institution logo */
const AvatarLogo = ({ organizationFiscalCode, serviceId }: AvatarLogoProps) => {
  const configuration = getConfiguration();

  const logoFullPath = () =>
    `${configuration.CDN_URL}${
      configuration.SERVICES_LOGO_PATH
    }${serviceId?.toLowerCase()}.png?${Date.now()}`;

  const [logoExists, setLogoExists] = useState(true);
  const [logoFile] = useState<string | ArrayBuffer | null>(logoFullPath());

  const renderNoLogo = () => (
    <Box
      paddingX="9px"
      paddingTop={0.5}
      fontSize={32}
      color={IOColors["grey-300"]}
    >
      <AccountBalanceRounded fontSize="inherit" />
    </Box>
  );

  const renderLogo = () => (
    <Image
      src={logoFile as string}
      width={LOGO_SIZE}
      height={LOGO_SIZE}
      style={{ objectFit: "scale-down" }}
      alt="logo"
      unoptimized={true}
      onError={() => setLogoExists(false)}
      onLoadingComplete={() => setLogoExists(true)}
    />
  );

  return (
    <Box
      width={66}
      height={66}
      padding={1}
      borderRadius={1}
      border="1px solid #E7E7E7"
    >
      {logoExists ? renderLogo() : renderNoLogo()}
    </Box>
  );
};

export default React.memo(AvatarLogo);
