import { Box, Step, StepLabel, Stepper } from "@mui/material";
import { useTranslation } from "next-i18next";

export type StepsPipelineProps = {
  steps: string[];
  activeStep: number;
};

/** Purely layout component to show the list of steps as a MUI Stepper with the indication of the current step
 * within the create/update process */
export const StepsPipeline = ({ steps, activeStep }: StepsPipelineProps) => {
  const { t } = useTranslation();

  return (
    <Box width={"100%"} marginY={5}>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label, index) => (
          <Step key={index}>
            <StepLabel>{t(label)}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};
