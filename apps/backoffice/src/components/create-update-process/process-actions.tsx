import { Grid } from "@mui/material";

import {
  ButtonBack,
  ButtonCancel,
  ButtonNext,
  ButtonWithLoader,
} from "../buttons";
import {
  ConfirmButtonLabelsType,
  CreateUpdateMode,
} from "./create-update-process";

export interface ProcessActionsProps {
  confirmButtonLabels: ConfirmButtonLabelsType;
  currentStepIndex: number;
  disabled?: boolean;
  mode: CreateUpdateMode;
  onBack: () => void;
  onCancel: () => void;
  onComplete: () => void;
  onNext: () => void;
  stepsNumber: number;
}

/** Render process action buttons such as cancel/back/next/send related to current process step */
export const ProcessActions = ({
  confirmButtonLabels,
  currentStepIndex,
  disabled,
  mode,
  onBack,
  onCancel,
  onComplete,
  onNext,
  stepsNumber,
}: ProcessActionsProps) => (
  <Grid container marginTop={3} spacing={0}>
    <Grid item xs={6}>
      {currentStepIndex > 0 ? (
        <ButtonBack disabled={disabled} onClick={onBack} />
      ) : (
        <ButtonCancel disabled={disabled} onClick={onCancel} />
      )}
    </Grid>
    <Grid item textAlign="right" xs={6}>
      {currentStepIndex < stepsNumber - 1 ? (
        <ButtonNext disabled={disabled} onClick={onNext} />
      ) : (
        <ButtonWithLoader
          disabled={disabled}
          label={confirmButtonLabels[mode]}
          loading={disabled}
          onClick={onComplete}
        />
      )}
    </Grid>
  </Grid>
);
