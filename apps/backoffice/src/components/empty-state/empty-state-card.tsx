import { RequiredAuthorizations } from "@/types/auth";
import { hasRequiredAuthorizations } from "@/utils/auth-util";
import { Stack, Typography } from "@mui/material";
import { ButtonNaked } from "@pagopa/mui-italia";
import NextLink from "next/link";
import { useSession } from "next-auth/react";
import { Trans, useTranslation } from "next-i18next";
import { ReactNode } from "react";

export type EmptyStateCardProps = {
  /** Call to action */
  cta?: emptyStateCardCta;
  /** Descriptive text for empty state */
  description: string;
  /** Icon to show on card top/center */
  icon?: ReactNode;
} & RequiredAuthorizations;

interface emptyStateCardCta {
  kind: "external" | "internal";
  label: string;
  link: string;
}

export const EmptyStateCard = ({
  requiredPermissions,
  requiredRole,
  ...props
}: EmptyStateCardProps) => {
  const { t } = useTranslation();
  const { data: session } = useSession();

  const showCta =
    props.cta &&
    hasRequiredAuthorizations(session, {
      requiredPermissions,
      requiredRole,
    });

  const renderCta = () => {
    if (props.cta?.kind === "internal")
      return (
        <NextLink href={props.cta.link}>
          <ButtonNaked color="primary" id="empty-state-card-cta" size="medium">
            {t(props.cta.label)}
          </ButtonNaked>
        </NextLink>
      );
    else
      return (
        <ButtonNaked
          color="primary"
          id="empty-state-card-cta"
          onClick={() => window.open(props.cta?.link, "_blank")}
          size="medium"
        >
          {t(props.cta?.label ?? "")}
        </ButtonNaked>
      );
  };

  return (
    <Stack
      alignItems="center"
      bgcolor={"#EFEFEF"}
      borderRadius={1}
      id="empty-state-card"
      padding={3}
      spacing={1}
    >
      {props.icon}
      <Typography
        id="empty-state-card-label"
        textAlign={"center"}
        variant="body2"
      >
        <Trans i18nKey={props.description}>{t(props.description)}</Trans>
      </Typography>

      {showCta && (
        <Typography
          id="empty-state-card-label"
          textAlign={"center"}
          variant="body2"
        >
          {renderCta()}
        </Typography>
      )}
    </Stack>
  );
};
