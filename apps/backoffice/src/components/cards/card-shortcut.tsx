import { Box, Button, Stack, Typography } from "@mui/material";
import NextLink from "next/link";
import { useTranslation } from "next-i18next";
import { ReactNode } from "react";

export interface CardShortcutProps {
  /** Call to action link placed in card footer */
  cta?: {
    endIcon?: ReactNode;
    href: string;
    label: string;
    startIcon?: ReactNode;
    target?: "_blank" | "_self";
  };
  /** If defined, render an icon on top of the card */
  icon?: ReactNode;
  /** Card principal text */
  text: string;
}

/**
 * Card used to show a shortcut consisting of a box with a main icon, text and a call to action button.
 */
export const CardShortcut = ({ cta, icon, text }: CardShortcutProps) => {
  const { t } = useTranslation();

  return (
    <Stack
      alignItems="center"
      bgcolor="#E9E9E9"
      borderColor="divider"
      borderRadius={2}
      color="text.secondary"
      direction="column"
      height="100%"
      justifyContent="center"
      padding={3}
      spacing={2}
    >
      {icon ?? null}
      <Typography
        color="inherit"
        id="card-title"
        textAlign="center"
        variant="body2"
      >
        {t(text)}
      </Typography>
      {cta ? (
        <Box marginTop={3}>
          <NextLink
            href={cta.href}
            rel="noreferrer"
            target={cta.target ?? "_self"}
          >
            <Button
              disableElevation
              size="small"
              startIcon={cta.startIcon}
              variant="contained"
            >
              {t(cta.label)}
            </Button>
          </NextLink>
        </Box>
      ) : null}
    </Stack>
  );
};
