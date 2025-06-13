import { Search } from "@mui/icons-material";
import { Button, Stack, TextField } from "@mui/material";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";

export interface InstitutionSearchByNameProps {
  /** event triggered when the search field is empty */
  onEmptySearch: () => void;
  /** event triggered when the search button is clicked */
  onSearchClick: (name: string) => void;
}

// Regex to remove not allowed characters
const unsafeCharsRegex = /[^A-Za-zÀ-ÖØ-öø-ÿ0-9\s.,'()&/\-:"]/g;

// Regex to validate entire string
const safeCharsRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9\s.,'()&/\-:"]{3,100}$/;

const sanitizeInput = (value: string): string =>
  value.replace(unsafeCharsRegex, "").slice(0, 100);

/** Renders a search by `institutionName` field */
export const InstitutionSearchByName = ({
  onEmptySearch,
  onSearchClick,
}: InstitutionSearchByNameProps) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState("");
  const [isValid, setIsValid] = useState(false);
  const buttonHeightStyle = { height: "44px" };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    const sanitized = sanitizeInput(rawInput);
    setInputValue(sanitized);
  };

  const handleSearchClick = () => {
    onSearchClick(inputValue);
  };

  const resetSearchInput = () => {
    setInputValue("");
  };

  const handleHelperText = () => {
    let label = "";

    if (isValid) label = "forms.institution.searchByName.validText";
    else if (!NonEmptyString.is(inputValue))
      label = "forms.institution.searchByName.helperText";
    else {
      label = "forms.institution.searchByName.errorText";
    }
    return t(label);
  };

  // real time input validation
  useEffect(() => {
    const valid = safeCharsRegex.test(inputValue);
    setIsValid(valid);
    if (!NonEmptyString.is(inputValue)) onEmptySearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue]);

  return (
    <Stack alignItems="flex-start" direction="row" paddingY={3} spacing={1}>
      <TextField
        InputProps={{
          endAdornment: <Search color="disabled" />,
        }}
        error={!isValid && NonEmptyString.is(inputValue)}
        helperText={handleHelperText()}
        id="institution-name"
        label={t("forms.institution.searchByName.label")}
        onChange={handleInputChange}
        size="small"
        sx={{ width: "450px" }}
        value={inputValue}
        variant="outlined"
      />
      <Button
        disabled={!isValid}
        onClick={handleSearchClick}
        sx={buttonHeightStyle}
        variant="outlined"
      >
        {t("forms.institution.searchByName.search")}
      </Button>
      {isValid ? (
        <Button
          onClick={resetSearchInput}
          sx={buttonHeightStyle}
          variant="text"
        >
          {t("forms.institution.searchByName.clear")}
        </Button>
      ) : null}
    </Stack>
  );
};
