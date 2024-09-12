import { RequiredAuthorizations } from "@/types/auth";
import { hasRequiredAuthorizations } from "@/utils/auth-util";
import { Box, Typography } from "@mui/material";
import { ButtonNaked } from "@pagopa/mui-italia";
import NextLink from "next/link";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { useState } from "react";

export type EmptyStateProps = {
  /** Call to action label for optional action button */
  ctaLabel: string;
  /** The path or URL to navigate to */
  ctaRoute: string;
  /** Descriptive label for empty state */
  emptyStateLabel: string;
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
      requiredRole,
    }),
  );

  const renderCta = () => {
    if (showCta)
      return (
        <NextLink href={props.ctaRoute}>
          <ButtonNaked
            color="primary"
            id="empty-state-cta"
            size="medium"
            sx={{ verticalAlign: "unset" }}
          >
            {t(props.ctaLabel)}
          </ButtonNaked>
        </NextLink>
      );
  };

  return (
    <Box bgcolor={"#EEEEEE"} id="empty-state" padding={3}>
      <Box bgcolor={"#FFFFFF"} padding={3}>
        <Typography id="empty-state-label" textAlign={"center"} variant="body2">
          {t(props.emptyStateLabel)} {renderCta()}
        </Typography>
      </Box>
    </Box>
  );
};
