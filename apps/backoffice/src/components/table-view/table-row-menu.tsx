import { MoreVertRounded } from "@mui/icons-material";
import {
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  Typography
} from "@mui/material";
import { useTranslation } from "next-i18next";
import { useState } from "react";

/** Define a single table row menu action item */
export type TableRowMenuAction = {
  /** menu label */
  label: string;
  /** if true, shows menu as danger one _(red text)_ */
  danger?: boolean;
  /** event triggered on menu item click */
  onClick: () => void;
};

/** Define table row menu action items */
export type TableRowMenuProps = {
  /** list of table row menu action items */
  actions: TableRowMenuAction[];
};

/** Renders a row related dropdown menu */
export const TableRowMenu = ({ actions }: TableRowMenuProps) => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const hasNoActions = () => actions.length === 0;

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleActionClick = (action: TableRowMenuAction) => {
    action.onClick();
    handleMenuClose();
  };

  if (hasNoActions()) return <></>;
  return (
    <>
      <IconButton
        aria-label="more"
        id="row-menu-button"
        aria-haspopup="true"
        onClick={handleMenuClick}
      >
        <MoreVertRounded fontSize="small" color={"primary"} />
      </IconButton>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
      >
        {actions.map((action, index) => (
          <MenuItem
            key={`row-action-${index}`}
            onClick={() => handleActionClick(action)}
          >
            <ListItemText>
              <Typography
                color={action.danger ? "error" : "primary"}
                variant="body2"
                fontWeight={600}
              >
                {t(action.label)}
              </Typography>
            </ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
