import { Box, Step, StepLabel, Stepper } from "@mui/material";
import { useTranslation } from "next-i18next";

export interface StepsPipelineProps {
  activeStep: number;
  steps: string[];
}

/** Purely layout component to show the list of steps as a MUI Stepper with the indication of the current step
 * within the create/update process */
export const StepsPipeline = ({ activeStep, steps }: StepsPipelineProps) => {
  const { t } = useTranslation();

  return (
    <Box marginY={5} width={"100%"}>
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
