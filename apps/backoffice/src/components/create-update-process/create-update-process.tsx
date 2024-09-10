import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Typography } from "@mui/material";
import _ from "lodash";
import { useTranslation } from "next-i18next";
import { useSnackbar } from "notistack";
import { ReactNode, useEffect, useState } from "react";
import {
  DefaultValues,
  FieldValues,
  FormProvider,
  useForm,
} from "react-hook-form";
import { ZodType } from "zod";

import { ProcessActions } from ".";
import { ButtonShowMore } from "../buttons";
import { buildSnackbarItem } from "../notification";
import { StepsPipeline } from "./steps-pipeline";

/** Interface for describe a create/update process step */
export interface BuilderStep {
  /** content of the step: usually a list of form fields */
  content: ReactNode;
  /** description for the step */
  description?: string;
  /** title of the step */
  label: string;
  /** if specified, a "more info" button will be displayed on top of step _(immediately under step label/description)_ */
  moreInfoUrl?: string;
  /** step fields validation schema as Zod type definitions */
  validationSchema: ZodType<any, any, any>;
}

export type CreateUpdateMode = "create" | "update";
export interface ConfirmButtonLabelsType {
  create: string;
  update: string;
}

export interface CreateUpdateProcessProps<T> {
  /** Label for final confirm button _(in both modes `create` and `update`)_ */
  confirmButtonLabels: ConfirmButtonLabelsType;
  /** item for which to carry out the creation or modification process */
  itemToCreateUpdate: DefaultValues<T>;
  /** Process mode: `create` or `update` */
  mode: CreateUpdateMode;
  /** event triggered on process exit */
  onCancel: () => void;
  /** event triggered on process completed, with result item of `T` */
  onConfirm: (value: T) => void;
  /** list of step that make up the process */
  steps: BuilderStep[];
}

/** Component for create/update an item o T generic type */
export function CreateUpdateProcess<T extends FieldValues>({
  confirmButtonLabels,
  itemToCreateUpdate,
  mode,
  onCancel,
  onConfirm,
  steps,
}: CreateUpdateProcessProps<T>) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const [currentStepIndex, setCurrentStep] = useState(0);
  const [sended, setSended] = useState(false);

  const methods = useForm({
    //shouldUnregister: true,
    defaultValues: itemToCreateUpdate,
    mode: "onChange",
    resolver: zodResolver(steps[currentStepIndex].validationSchema),
  });

  const {
    clearErrors,
    formState: { isValid },
    getValues,
    trigger,
  } = methods;

  const decreaseStep = () => {
    clearErrors();
    setCurrentStep(currentStepIndex - 1);
  };
  const increaseStep = () => {
    clearErrors();
    setCurrentStep(currentStepIndex + 1);
  };

  const handleShowMore = () => {
    if (steps[currentStepIndex].moreInfoUrl)
      window.open(steps[currentStepIndex].moreInfoUrl as string);
  };

  const handleNext = () => {
    isValid ? increaseStep() : trigger();
  };

  const handleComplete = () => {
    if (isValid) {
      // update mode check:
      // if initial form values are equals to final form values,
      // then send a warning notification and abort onConfirm event trigger.
      if (mode === "update" && _.isEqual(itemToCreateUpdate, getValues())) {
        enqueueSnackbar(
          buildSnackbarItem({
            message: "",
            severity: "warning",
            title: t("notifications.noChangeError"),
          }),
        );
        return;
      }
      setSended(true);
      onConfirm(getValues());
    } else {
      trigger();
    }
  };

  useEffect(() => {
    methods.reset(itemToCreateUpdate); // update form values when change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemToCreateUpdate]);

  const renderStepDescription = () => {
    if (steps[currentStepIndex].description)
      return (
        <Typography variant="body2">
          {t(steps[currentStepIndex].description as string)}
        </Typography>
      );
  };

  const renderStepMoreInfo = () => {
    if (steps[currentStepIndex].moreInfoUrl)
      return <ButtonShowMore onClick={handleShowMore} />;
  };

  return (
    <>
      <StepsPipeline
        activeStep={currentStepIndex}
        steps={steps.map((step) => step.label)}
      />
      <Box bgcolor="background.paper" borderRadius="4px" padding="24px">
        <Typography variant="h5">{t(steps[currentStepIndex].label)}</Typography>
        {renderStepDescription()}
        {renderStepMoreInfo()}
        <FormProvider {...methods}>
          <Box autoComplete="off" component="form" margin={2} marginY={5}>
            {steps[currentStepIndex].content}
          </Box>
        </FormProvider>
      </Box>
      <ProcessActions
        confirmButtonLabels={confirmButtonLabels}
        currentStepIndex={currentStepIndex}
        disabled={sended}
        mode={mode}
        onBack={decreaseStep}
        onCancel={onCancel}
        onComplete={handleComplete}
        onNext={handleNext}
        stepsNumber={steps.length}
      />
    </>
  );
}
