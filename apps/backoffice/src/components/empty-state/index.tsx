import { RequiredAuthorizations } from "@/types/auth";
import { hasRequiredAuthorizations } from "@/utils/auth-util";
import { Box, Typography } from "@mui/material";
import { ButtonNaked } from "@pagopa/mui-italia";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import NextLink from "next/link";
import { useState } from "react";

export type EmptyStateProps = {
  /** Descriptive label for empty state */
  emptyStateLabel: string;
  /** Call to action label for optional action button */
  ctaLabel: string;
  /** The path or URL to navigate to */
  ctaRoute: string;
} & RequiredAuthorizations;

export const EmptyState = ({
  requiredPermissions,
  requiredRole,
  ...props
}: EmptyStateProps) => {
  const { t } = useTranslation();
  const { data: session } = useSession();

  const [showCta] = useState(
    hasRequiredAuthorizations(session, {
      requiredPermissions,
      requiredRole
    })
  );

  const renderCta = () => {
    if (showCta)
      return (
        <NextLink href={props.ctaRoute}>
          <ButtonNaked
            id="empty-state-cta"
            color="primary"
            size="medium"
            sx={{ verticalAlign: "unset" }}
          >
            {t(props.ctaLabel)}
          </ButtonNaked>
        </NextLink>
      );
  };

  return (
    <Box id="empty-state" padding={3} bgcolor={"#EEEEEE"}>
      <Box padding={3} bgcolor={"#FFFFFF"}>
        <Typography id="empty-state-label" variant="body2" textAlign={"center"}>
          {t(props.emptyStateLabel)} {renderCta()}
        </Typography>
      </Box>
    </Box>
  );
};
