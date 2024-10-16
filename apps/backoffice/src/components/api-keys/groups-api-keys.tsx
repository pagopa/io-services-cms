import { Box, Button, Typography } from "@mui/material";
import NextLink from "next/link";
import { useTranslation } from "next-i18next";
import React from "react";
import { Add } from "@mui/icons-material";

interface GroupsApiKeyProps {}

function GroupsApiKey({}: GroupsApiKeyProps) {
  const { t } = useTranslation();

  const ADD_GROUPS_KEY_ROUTE = "/new-group-api-key";
  return (
    <Box
      bgcolor="background.paper"
      borderRadius={0.5}
      id="card-details"
      padding={3}
    >
      <Typography variant="h6">{t("groupsApiKeys.title")}</Typography>
      <Typography
        color="text.secondary"
        marginBottom={3}
        marginTop={1}
        variant="body2"
      >
        {t("groupsApiKeys.description")}
      </Typography>
      <NextLink
        href={ADD_GROUPS_KEY_ROUTE}
        passHref
        style={{ textDecoration: "none" }}
      >
        <Button size="medium" startIcon={<Add />} variant="contained">
          {t("groupsApiKeys.add")}
        </Button>
      </NextLink>
    </Box>
  );
}

export default GroupsApiKey;
