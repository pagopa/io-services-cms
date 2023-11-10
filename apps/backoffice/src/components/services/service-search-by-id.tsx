import { Search } from "@mui/icons-material";
import { Button, Stack, TextField } from "@mui/material";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";

export type ServiceSearchByIdProps = {
  /** event triggered when the search icon is clicked. \
   * _(assumes a validated serviceId  `id` output)_ */
  onSearchClick: (id: string) => void;
  /** event triggered when the search field is empty */
  onEmptySearch: () => void;
};

/** Renders a search by `serviceId` field */
export const ServiceSearchById = ({
  onSearchClick,
  onEmptySearch
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
    <Stack paddingY={3} direction="row" spacing={1} alignItems="flex-start">
      <TextField
        id="service-id"
        label={t("forms.service.searchById.label")}
        variant="outlined"
        value={inputValue}
        onChange={handleInputChange}
        size="small"
        sx={{ width: "450px" }}
        InputProps={{
          endAdornment: <Search color="disabled" />
        }}
        error={!isValid && NonEmptyString.is(inputValue)}
        helperText={handleHelperText()}
      />
      <Button
        variant="outlined"
        disabled={!isValid}
        sx={buttonHeightStyle}
        onClick={handleSearchClick}
      >
        {t("forms.service.searchById.search")}
      </Button>
      {isValid ? (
        <Button
          variant="text"
          sx={buttonHeightStyle}
          onClick={resetSearchInput}
        >
          {t("forms.service.searchById.clear")}
        </Button>
      ) : null}
    </Stack>
  );
};
