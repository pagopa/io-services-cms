import { AddCircleOutline, RemoveCircleOutline } from "@mui/icons-material";
import { Button, Grid } from "@mui/material";
import React from "react";

export interface ButtonAddRemoveRowProps {
  addLabel: string;
  isRemoveActionVisible?: boolean;
  onAdd?: () => void;
  onRemove?: () => void;
  removeLabel: string;
}

export const ButtonAddRemove: React.FC<ButtonAddRemoveRowProps> = ({
  addLabel,
  isRemoveActionVisible = false,
  onAdd,
  onRemove,
  removeLabel,
}) => (
  <Grid item md={6} xs={12}>
    {isRemoveActionVisible ? (
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
);

export default ButtonAddRemove;
