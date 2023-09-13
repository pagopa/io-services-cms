import { Box, Button, Stack, Typography } from "@mui/material";
import NextLink from "next/link";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

export type CardShortcutProps = {
  /** If defined, render an icon on top of the card */
  icon?: ReactNode;
  /** Card principal text */
  text: string;
  /** Call to action link placed in card footer */
  cta?: {
    startIcon?: ReactNode;
    label: string;
    endIcon?: ReactNode;
    href: string;
    target?: "_blank" | "_self";
  };
};

/**
 * Card used to show a shortcut consisting of a box with a main icon, text and a call to action button.
 */
export const CardShortcut = ({ icon, text, cta }: CardShortcutProps) => {
  const { t } = useTranslation();

  return (
    <Stack
      height="100%"
      bgcolor="#E9E9E9"
      padding={3}
      borderRadius={2}
      borderColor="divider"
      color="text.secondary"
      direction="column"
      justifyContent="center"
      alignItems="center"
      spacing={2}
    >
      {icon ?? null}
      <Typography
        id="card-title"
        variant="body2"
        textAlign="center"
        color="inherit"
      >
        {t(text)}
      </Typography>
      {cta ? (
        <Box marginTop={3}>
          <NextLink
            href={cta.href}
            target={cta.target ?? "_self"}
            rel="noreferrer"
          >
            <Button
              variant="contained"
              size="small"
              startIcon={cta.startIcon}
              disableElevation
            >
              {t(cta.label)}
            </Button>
          </NextLink>
        </Box>
      ) : null}
    </Stack>
  );
};
