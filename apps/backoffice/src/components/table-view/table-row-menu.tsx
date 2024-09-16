import { MoreVertRounded } from "@mui/icons-material";
import {
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import { useTranslation } from "next-i18next";
import { ReactNode, useState } from "react";

/** Define a single table row menu action item */
export interface TableRowMenuAction {
  /** if true, shows menu as danger one _(red text)_ */
  danger?: boolean;
  /** menu icon */
  icon: ReactNode;
  /** menu label */
  label: string;
  /** event triggered on menu item click */
  onClick: () => void;
}

/** Define table row menu action items */
export interface TableRowMenuProps {
  /** list of table row menu action items */
  actions: TableRowMenuAction[];
}

/** Renders a row related dropdown menu */
export const TableRowMenu = ({ actions }: TableRowMenuProps) => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
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
        aria-haspopup="true"
        aria-label="more"
        id="row-menu-button"
        onClick={handleMenuClick}
      >
        <MoreVertRounded color={"primary"} fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        id="basic-menu"
        onClose={handleMenuClose}
        open={open}
      >
        {actions.map((action, index) => (
          <MenuItem
            key={`row-action-${index}`}
            onClick={() => handleActionClick(action)}
          >
            <ListItemIcon>{action.icon}</ListItemIcon>
            <ListItemText>
              <Typography
                color={action.danger ? "error" : "primary"}
                fontWeight={600}
                variant="body2"
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
