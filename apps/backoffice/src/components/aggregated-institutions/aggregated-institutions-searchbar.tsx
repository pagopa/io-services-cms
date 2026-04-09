import {
  InstitutionSearchByName,
  InstitutionSearchByNameProps,
} from "@/components/institutions";
import { Button, Stack } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";

interface AggregatedInstitutionsSearchBarProps
  extends InstitutionSearchByNameProps {
  disableGenerate?: boolean;
  /** event triggered when the generate button is clicked */
  onGenerateClick: () => void;
}

export const AggregatedInstitutionsSearchBar = ({
  disableGenerate,
  onGenerateClick,
  ...institutionSearchByNameProps
}: AggregatedInstitutionsSearchBarProps) => {
  const { t } = useTranslation();

  return (
    <Stack
      direction="row"
      flexWrap="wrap"
      gap={1}
      justifyContent="space-between"
      paddingY={3}
    >
      <InstitutionSearchByName {...institutionSearchByNameProps} />
      <Button
        disabled={disableGenerate}
        onClick={onGenerateClick}
        variant="outlined"
      >
        {t("routes.aggregated-institutions.exportDialog.generateButton")}
      </Button>
    </Stack>
  );
};
