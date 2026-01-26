import { AddCircleOutline, RemoveCircleOutline } from "@mui/icons-material";
import { Button, Grid } from "@mui/material";
import React from "react";

export interface ButtonAddRemoveRowProps {
  addLabel: string;
  kind?: "add" | "remove";
  onAdd?: () => void;
  onRemove?: () => void;
  removeLabel: string;
}

export const ButtonAddRemove: React.FC<ButtonAddRemoveRowProps> = ({
  addLabel,
  kind = "add",
  onAdd,
  onRemove,
  removeLabel,
}) => (
  <Grid item md={6} xs={12}>
    {kind === "remove" ? (
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
