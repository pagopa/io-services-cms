import { Search } from "@mui/icons-material";
import { Button, Stack, TextField } from "@mui/material";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";

export interface ServiceSearchByIdProps {
  /** event triggered when the search field is empty */
  onEmptySearch: () => void;
  /** event triggered when the search icon is clicked. \
   * _(assumes a validated serviceId  `id` output)_ */
  onSearchClick: (id: string) => void;
}

/** Renders a search by `serviceId` field */
export const ServiceSearchById = ({
  onEmptySearch,
  onSearchClick,
}: ServiceSearchByIdProps) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState("");
  const [isValid, setIsValid] = useState(false);
  const buttonHeightStyle = { height: "44px" };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitizedInput = e.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 26);
    setInputValue(sanitizedInput);
  };

  const handleSearchClick = () => {
    onSearchClick(inputValue);
  };

  const resetSearchInput = () => {
    setInputValue("");
  };

  const handleHelperText = () => {
    let label = "";

    if (isValid) label = "forms.service.searchById.validText";
    else if (!NonEmptyString.is(inputValue))
      label = "forms.service.searchById.helperText";
    else {
      label = "forms.service.searchById.errorText";
    }
    return t(label);
  };

  useEffect(() => {
    setIsValid(/^[A-Z0-9]{26}$/.test(inputValue));
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
        id="service-id"
        label={t("forms.service.searchById.label")}
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
        {t("forms.service.searchById.search")}
      </Button>
      {isValid ? (
        <Button
          onClick={resetSearchInput}
          sx={buttonHeightStyle}
          variant="text"
        >
          {t("forms.service.searchById.clear")}
        </Button>
      ) : null}
    </Stack>
  );
};
