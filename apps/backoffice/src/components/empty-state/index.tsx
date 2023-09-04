import { Box, Typography } from "@mui/material";
import { ButtonNaked } from "@pagopa/mui-italia";
import { useTranslation } from "next-i18next";
import NextLink from "next/link";

export type EmptyStateProps = {
  emptyStateLabel: string;
  ctaLabel: string;
  ctaRoute: string;
};

export const EmptyState = ({ ...props }: EmptyStateProps) => {
  const { t } = useTranslation();
  return (
    <Box padding={"24px"} bgcolor={"#EEEEEE"}>
      <Box padding={"24px"} bgcolor={"#FFFFFF"}>
        <Typography variant="body2" textAlign={"center"}>
          {t(props.emptyStateLabel)}{" "}
          <NextLink href={props.ctaRoute}>
            <ButtonNaked
              color="primary"
              size="medium"
              sx={{ verticalAlign: "unset" }}
            >
              {t(props.ctaLabel)}
            </ButtonNaked>
          </NextLink>
        </Typography>
      </Box>
    </Box>
  );
};
