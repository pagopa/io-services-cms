import { Grid } from "@mui/material";
import {
  ButtonBack,
  ButtonCancel,
  ButtonNext,
  ButtonWithLoader
} from "../buttons";

export type ProcessActionsProps = {
  disabled?: boolean;
  stepsNumber: number;
  currentStepIndex: number;
  onCancel: () => void;
  onBack: () => void;
  onNext: () => void;
  onComplete: () => void;
};

/** Render process action buttons such as cancel/back/next/send related to current process step */
export const ProcessActions = ({
  disabled,
  stepsNumber,
  currentStepIndex,
  onCancel,
  onBack,
  onNext,
  onComplete
}: ProcessActionsProps) => {
  return (
    <Grid container spacing={0} marginTop={3}>
      <Grid item xs={6}>
        {currentStepIndex > 0 ? (
          <ButtonBack onClick={onBack} disabled={disabled} />
        ) : (
          <ButtonCancel onClick={onCancel} disabled={disabled} />
        )}
      </Grid>
      <Grid item xs={6} textAlign="right">
        {currentStepIndex < stepsNumber - 1 ? (
          <ButtonNext onClick={onNext} disabled={disabled} />
        ) : (
          <ButtonWithLoader
            label="buttons.createDraft"
            onClick={onComplete}
            loading={disabled}
            disabled={disabled}
          />
        )}
      </Grid>
    </Grid>
  );
};
