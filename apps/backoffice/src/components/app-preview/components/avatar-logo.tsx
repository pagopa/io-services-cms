import { getConfiguration } from "@/config";
import { AccountBalanceRounded } from "@mui/icons-material";
import { Box } from "@mui/material";
import Image from "next/image";
import React, { useState } from "react";

import { IOColors } from ".";

const LOGO_SIZE = 48;

export interface AvatarLogoProps {
  organizationFiscalCode: string;
  serviceId: string;
}

/** Render rounded box with service/institution logo */
const AvatarLogo = ({ organizationFiscalCode, serviceId }: AvatarLogoProps) => {
  const configuration = getConfiguration();

  const logoFullPath = () =>
    `${configuration.CDN_URL}${
      configuration.SERVICES_LOGO_PATH
    }${serviceId?.toLowerCase()}.png?${Date.now()}`;

  const [logoExists, setLogoExists] = useState(true);
  const [logoFile] = useState<ArrayBuffer | null | string>(logoFullPath());

  const renderNoLogo = () => (
    <Box
      color={IOColors["grey-300"]}
      fontSize={32}
      paddingTop={0.5}
      paddingX="9px"
    >
      <AccountBalanceRounded fontSize="inherit" />
    </Box>
  );

  const renderLogo = () => (
    <Image
      alt="logo"
      height={LOGO_SIZE}
      onError={() => setLogoExists(false)}
      onLoadingComplete={() => setLogoExists(true)}
      src={logoFile as string}
      style={{ objectFit: "scale-down" }}
      unoptimized={true}
      width={LOGO_SIZE}
    />
  );

  return (
    <Box
      border="1px solid #E7E7E7"
      borderRadius={1}
      height={66}
      padding={1}
      width={66}
    >
      {logoExists ? renderLogo() : renderNoLogo()}
    </Box>
  );
};

export default React.memo(AvatarLogo);
