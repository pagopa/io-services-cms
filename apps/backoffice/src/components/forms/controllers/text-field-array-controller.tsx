import { Add, Delete, Edit, ErrorOutline } from "@mui/icons-material";
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  TextFieldProps,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";
import {
  Controller,
  get,
  useFieldArray,
  useFormContext,
} from "react-hook-form";

export type TextFieldArrayControllerProps = {
  /** Label for Add field button */
  addButtonLabel: string;
  /** Add Cancel button _(could be used to reset original fields value)_ */
  addCancelButton?: boolean;
  /** Default value for added field */
  addDefaultValue: string;
  /** Add Save button */
  addSaveButton?: boolean;
  /** Indentify if fields are editable. If true, a 'Modify' button will be present for each field */
  editable?: boolean;
  /** Single text field label _(completed programmatically with 'index+1' position in the array. es.: 'labelvalue 1' identity first field in the array)_ */
  itemLabel?: string;
  /** Controller name _(will be used as reference in the form)_ */
  name: string;
  /** Event triggered when user click on Cancel button */
  onCancelClick?: () => void;
  /** Event triggered when user click on Save button */
  onSaveClick?: () => void;
  /** Identity if fields are (or starts) readonly. If true, fields are not editable and have a different readonly render _(until click on Modify if editable)_ */
  readOnly?: boolean;
  /** If `true` show a generic 'invalid field' error instead of particular field error */
  showGenericErrorMessage?: boolean;
} & TextFieldProps;

interface RenderedFieldType {
  editable: boolean;
  id: string;
  readOnly: boolean;
  value: unknown;
}

/** Controller for Array of TextFields */
export function TextFieldArrayController({
  addButtonLabel,
  addCancelButton,
  addDefaultValue,
  addSaveButton,
  editable,
  itemLabel,
  name,
  onCancelClick,
  onSaveClick,
  readOnly,
  showGenericErrorMessage,
  ...props
}: TextFieldArrayControllerProps) {
  const { t } = useTranslation();

  // react-hook-form settings
  const { control, formState, getValues, register } = useFormContext();
  const { append, fields, remove } = useFieldArray({
    control,
    name,
  });
  const errors = get(formState.errors, name);

  // general form initialization status
  const [isReadOnly] = useState(readOnly);
  const [isEditable] = useState(editable);

  /** get name of a single field by array position `index` */
  const getFieldName = (index: number) => `${name}[${index}]`;

  const initializeFieldsStatus = (): RenderedFieldType[] =>
    Array.from({ length: fields.length }, (_, index) => ({
      editable: isEditable ?? false,
      id: index.toString(),
      readOnly: isReadOnly
        ? getValues(getFieldName(index)) !== addDefaultValue
        : false,
      value: getValues(getFieldName(index)),
    }));

  // individual field initialization status
  const [renderedFields, setRenderedFields] = useState<RenderedFieldType[]>(
    initializeFieldsStatus(),
  );

  const handleCancelClick = () => {
    onCancelClick && onCancelClick();
    setRenderedFields(initializeFieldsStatus());
  };

  /** shows generic or detailed error message based on `showGenericErrorMessage` prop */
  const showErrorMessage = (message: any) =>
    showGenericErrorMessage ? t("forms.errors.field.invalid") : message;

  useEffect(() => {
    setRenderedFields(initializeFieldsStatus());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields.length]);

  return (
    <>
      {fields.map((item, index) => (
        <Box key={item.id} paddingY={1}>
          <Stack
            alignItems="center"
            bgcolor="#F9F9F9"
            direction="row"
            display="inline-block"
            padding={2}
            spacing={2}
          >
            <Controller
              control={control}
              name={getFieldName(index)}
              render={({ field: { onChange, value } }) => (
                <TextField
                  {...register(getFieldName(index))}
                  {...props}
                  InputProps={{
                    ...props.InputProps,
                    endAdornment:
                      errors && errors[index] ? (
                        <InputAdornment position="end">
                          <ErrorOutline color="error" />
                        </InputAdornment>
                      ) : undefined,
                    readOnly: renderedFields[index]?.readOnly,
                  }}
                  error={!!errors && !!errors[index]}
                  helperText={
                    errors && errors[index]
                      ? showErrorMessage(errors[index].message)
                      : null
                  }
                  hiddenLabel={!itemLabel}
                  label={itemLabel ? `${t(itemLabel)} - ${index + 1}` : null}
                  margin="normal"
                  onChange={onChange}
                  size={props.size}
                  sx={
                    renderedFields[index]?.readOnly
                      ? {
                          pointerEvents: "none",
                        }
                      : {}
                  }
                  value={value}
                />
              )}
            />
            {renderedFields[index]?.editable ? ( // render edit and delete buttons for each field
              <>
                {renderedFields[index]?.readOnly ? (
                  <IconButton
                    color="primary"
                    onClick={() => {
                      renderedFields[index].readOnly = false;
                      renderedFields[index].editable = true;
                      setRenderedFields({ ...renderedFields });
                    }}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                ) : null}
                <IconButton
                  color={"error" as any}
                  onClick={() => {
                    remove(index);
                  }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </>
            ) : null}
          </Stack>
        </Box>
      ))}
      {addSaveButton || addCancelButton ? (
        <Stack
          direction="row"
          justifyContent="flex-start"
          marginBottom={2}
          marginTop={1}
          spacing={2}
        >
          {addSaveButton ? (
            <Button onClick={onSaveClick} variant="contained">
              {t("buttons.save")}
            </Button>
          ) : null}
          {addCancelButton ? (
            <Button onClick={handleCancelClick} variant="outlined">
              {t("buttons.cancel")}
            </Button>
          ) : null}
        </Stack>
      ) : null}
      {editable ? (
        <Button
          onClick={() => {
            append(addDefaultValue);
          }}
          startIcon={<Add />}
          variant="text"
        >
          {t(addButtonLabel)}
        </Button>
      ) : null}
    </>
  );
}
