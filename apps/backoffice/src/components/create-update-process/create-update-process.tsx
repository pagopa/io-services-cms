import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "next-i18next";
import { ReactNode, useEffect, useState } from "react";
import {
  DefaultValues,
  FieldValues,
  FormProvider,
  useForm
} from "react-hook-form";
import { ZodType } from "zod";
import { ProcessActions } from ".";
import { ButtonShowMore } from "../buttons";
import { StepsPipeline } from "./steps-pipeline";

/** Interface for describe a create/update process step */
export type BuilderStep = {
  /** title of the step */
  label: string;
  /** description for the step */
  description?: string;
  /** if specified, a "more info" button will be displayed on top of step _(immediately under step label/description)_ */
  moreInfoUrl?: string;
  /** content of the step: usually a list of form fields */
  content: ReactNode;
  /** step fields validation schema as Zod type definitions */
  validationSchema: ZodType<any, any, any>;
};

export type CreateUpdateMode = "create" | "update";

export type CreateUpdateProcessProps<T> = {
  /** item for which to carry out the creation or modification process */
  itemToCreateUpdate: DefaultValues<T>;
  /** list of step that make up the process */
  steps: BuilderStep[];
  /** Process mode: `create` or `update` */
  mode: CreateUpdateMode;
  /** event triggered on process exit */
  onCancel: () => void;
  /** event triggered on process completed, with result item of `T` */
  onConfirm: (value: T) => void;
};

/** Component for create/update an item o T generic type */
export function CreateUpdateProcess<T extends FieldValues>({
  itemToCreateUpdate,
  steps,
  onCancel,
  onConfirm
}: CreateUpdateProcessProps<T>) {
  const { t } = useTranslation();

  const [currentStepIndex, setCurrentStep] = useState(0);
  const [sended, setSended] = useState(false);

  const methods = useForm({
    //shouldUnregister: true,
    defaultValues: itemToCreateUpdate,
    resolver: zodResolver(steps[currentStepIndex].validationSchema),
    mode: "onChange"
  });

  const {
    getValues,
    clearErrors,
    trigger,
    formState: { isValid }
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
        steps={steps.map(step => step.label)}
      />
      <Box bgcolor="background.paper" padding="24px" borderRadius="4px">
        <Typography variant="h5">{t(steps[currentStepIndex].label)}</Typography>
        {renderStepDescription()}
        {renderStepMoreInfo()}
        <FormProvider {...methods}>
          <Box marginY={5} component="form" margin={2} autoComplete="off">
            {steps[currentStepIndex].content}
          </Box>
        </FormProvider>
      </Box>
      <ProcessActions
        stepsNumber={steps.length}
        currentStepIndex={currentStepIndex}
        onBack={decreaseStep}
        onCancel={onCancel}
        onNext={handleNext}
        onComplete={handleComplete}
        disabled={sended}
      />
    </>
  );
}
