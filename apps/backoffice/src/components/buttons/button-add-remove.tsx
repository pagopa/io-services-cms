import { AddCircleOutline, RemoveCircleOutline } from "@mui/icons-material";
import { Button, Grid } from "@mui/material";
import React from "react";

export interface ButtonAddRemoveRowProps {
  addLabel: string;
  initialStateRemove?: boolean;
  onAdd?: () => void;
  onRemove?: () => void;
  removeLabel: string;
  show?: boolean;
}

export const ButtonAddRemove: React.FC<ButtonAddRemoveRowProps> = ({
  addLabel,
  initialStateRemove = false,
  onAdd,
  onRemove,
  removeLabel,
  show = true,
}) => {
  if (!show) return null;

  return (
    <>
      <Grid item md={6} xs={12}>
        {initialStateRemove ? (
          <Button
            color="error"
            onClick={onRemove}
            startIcon={<RemoveCircleOutline />}
            variant="text"
          >
            {removeLabel}
          </Button>
        ) : (
          <Button
            color="primary"
            onClick={onAdd}
            startIcon={<AddCircleOutline />}
            variant="text"
          >
            {addLabel}
          </Button>
        )}
      </Grid>
      <Grid item md={6} xs={12} />
    </>
  );
};

export default ButtonAddRemove;
