import { Add, Delete, Edit, ErrorOutline } from "@mui/icons-material";
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  TextFieldProps
} from "@mui/material";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";
import {
  Controller,
  get,
  useFieldArray,
  useFormContext
} from "react-hook-form";

export type TextFieldArrayControllerProps = {
  /** Controller name _(will be used as reference in the form)_ */
  name: string;
  /** Single text field label _(completed programmatically with 'index+1' position in the array. es.: 'labelvalue 1' identity first field in the array)_ */
  itemLabel?: string;
  /** Label for Add field button */
  addButtonLabel: string;
  /** Default value for added field */
  addDefaultValue: string;
  /** Indentify if fields are editable. If true, a 'Modify' button will be present for each field */
  editable?: boolean;
  /** Identity if fields are (or starts) readonly. If true, fields are not editable and have a different readonly render _(until click on Modify if editable)_ */
  readOnly?: boolean;
  /** Add Save button */
  addSaveButton?: boolean;
  /** Event triggered when user click on Save button */
  onSaveClick?: () => void;
  /** Add Cancel button _(could be used to reset original fields value)_ */
  addCancelButton?: boolean;
  /** Event triggered when user click on Cancel button */
  onCancelClick?: () => void;
  /** If `true` show a generic 'invalid field' error instead of particular field error */
  showGenericErrorMessage?: boolean;
} & TextFieldProps;

/** Controller for Array of TextFields */
export function TextFieldArrayController({
  name,
  itemLabel,
  addButtonLabel,
  addDefaultValue,
  editable,
  readOnly,
  addSaveButton,
  onSaveClick,
  addCancelButton,
  onCancelClick,
  showGenericErrorMessage,
  ...props
}: TextFieldArrayControllerProps) {
  const { t } = useTranslation();

  // react-hook-form settings
  const { register, control, formState, getValues } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name
  });
  const errors = get(formState.errors, name);

  // general form initialization status
  const [isReadOnly] = useState(readOnly);
  const [isEditable] = useState(editable);

  /** get name of a single field by array position `index` */
  const getFieldName = (index: number) => `${name}[${index}]`;

  const initializeFieldsStatus = () =>
    Array.from({ length: fields.length }, (_, index) => ({
      id: index.toString() as any,
      value: getValues(getFieldName(index)),
      readOnly: isReadOnly
        ? getValues(getFieldName(index)) !== addDefaultValue
        : false,
      editable: isEditable ?? false
    }));

  // individual field initialization status
  const [renderedFields, setRenderedFields] = useState(
    initializeFieldsStatus()
  );

  /** shows generic or detailed error message based on `showGenericErrorMessage` prop */
  const showErrorMessage = (message: any) =>
    showGenericErrorMessage ? t("forms.errors.field.invalid") : message;

  // managing the disable state when not in edit mode
  const [isInEditMode, setIsInEditMode] = useState(false);

  useEffect(() => {
    setRenderedFields(initializeFieldsStatus());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields.length]);

  return (
    <>
      {fields.map((item, index, items) => {
        return (
          <Box key={item.id} paddingY={1}>
            <Stack
              direction="row"
              alignItems="center"
              display="inline-block"
              spacing={2}
              padding={2}
              bgcolor="#F9F9F9"
            >
              <Controller
                name={getFieldName(index)}
                control={control}
                render={({ field: { onChange, value } }) => (
                  <TextField
                    {...register(getFieldName(index))}
                    {...props}
                    margin="normal"
                    sx={
                      !isInEditMode
                        ? {
                            pointerEvents: "none"
                          }
                        : {}
                    }
                    size={props.size}
                    value={value}
                    label={itemLabel ? `${t(itemLabel)} - ${index + 1}` : null}
                    hiddenLabel={!itemLabel}
                    InputProps={{
                      ...props.InputProps,
                      readOnly: renderedFields[index]?.readOnly,
                      endAdornment:
                        errors && errors[index] ? (
                          <InputAdornment position="end">
                            <ErrorOutline color="error" />
                          </InputAdornment>
                        ) : (
                          undefined
                        )
                    }}
                    error={!!errors && !!errors[index]}
                    helperText={
                      errors && errors[index]
                        ? showErrorMessage(errors[index].message)
                        : null
                    }
                    onChange={onChange}
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
                        setIsInEditMode(true);
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
        );
      })}
      {addSaveButton || addCancelButton ? (
        <Stack
          direction="row"
          spacing={2}
          justifyContent="flex-start"
          marginTop={1}
          marginBottom={2}
        >
          {addSaveButton ? (
            <Button
              variant="contained"
              onClick={() => {
                onSaveClick && onSaveClick();
                setIsInEditMode(false);
              }}
            >
              {t("buttons.save")}
            </Button>
          ) : null}
          {addCancelButton ? (
            <Button
              variant="outlined"
              onClick={() => {
                onCancelClick && onCancelClick();
                setIsInEditMode(false);
              }}
            >
              {t("buttons.cancel")}
            </Button>
          ) : null}
        </Stack>
      ) : null}
      {editable ? (
        <Button
          variant="text"
          startIcon={<Add />}
          onClick={() => {
            append(addDefaultValue);
          }}
        >
          {t(addButtonLabel)}
        </Button>
      ) : null}
    </>
  );
}
