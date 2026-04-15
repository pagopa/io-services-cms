import {
  InstitutionSearchByName,
  InstitutionSearchByNameProps,
} from "@/components/institutions";
import { Button, Stack, Tooltip } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";

export interface AggregatedInstitutionsSearchBarProps
  extends InstitutionSearchByNameProps {
  disableGenerate?: boolean;
  hideGenerate?: boolean;
  /** event triggered when the generate button is clicked */
  onGenerateClick: () => void;
}

export const AggregatedInstitutionsSearchBar = ({
  disableGenerate,
  hideGenerate,
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
      {!hideGenerate && (
        <Tooltip
          arrow
          disableFocusListener={!disableGenerate}
          disableHoverListener={!disableGenerate}
          disableInteractive={!disableGenerate}
          disableTouchListener={!disableGenerate}
          placement="left"
          title={t("routes.aggregated-institutions.exportDialog.tooltipTitle")}
        >
          <span>
            <Button
              disabled={disableGenerate}
              onClick={onGenerateClick}
              variant="outlined"
            >
              {t("routes.aggregated-institutions.exportDialog.generateButton")}
            </Button>
          </span>
        </Tooltip>
      )}
    </Stack>
  );
};
