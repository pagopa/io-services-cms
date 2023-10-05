import {
  CheckCircleOutline,
  Delete,
  Edit,
  History,
  MoreVert
} from "@mui/icons-material";
import {
  Button,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  Typography
} from "@mui/material";
import { useTranslation } from "next-i18next";
import NextLink from "next/link";
import { useState } from "react";

export type ServiceDetailsMenuProps = {
  serviceId: string;
};

// TODO It's just a placeholder
export const ServiceDetailsMenu = ({ serviceId }: ServiceDetailsMenuProps) => {
  const { t } = useTranslation();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Stack direction="row-reverse" spacing={2}>
      <>
        <Button
          id="basic-button"
          aria-controls={open ? "basic-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          onClick={handleClick}
          size="medium"
          variant="text"
          sx={{ bgcolor: "background.paper", padding: 0 }}
        >
          <MoreVert />
        </Button>
        <Menu
          id="basic-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            "aria-labelledby": "basic-button"
          }}
          disableScrollLock
        >
          <NextLink
            href={`/services/${serviceId}/edit-service`}
            passHref
            style={{ textDecoration: "none" }}
          >
            <MenuItem onClick={handleClose}>
              <ListItemIcon>
                <Edit fontSize="inherit" />
              </ListItemIcon>
              <Typography variant="inherit" marginLeft={1}>
                Modifica
              </Typography>
            </MenuItem>
          </NextLink>
          <MenuItem onClick={handleClose}>
            <ListItemIcon>
              <Delete fontSize="inherit" color="error" />
            </ListItemIcon>
            <Typography variant="inherit" color="error" marginLeft={1}>
              Elimina
            </Typography>
          </MenuItem>
        </Menu>
      </>
      <Button
        size="medium"
        variant="text"
        sx={{ bgcolor: "background.paper", padding: 0 }}
      >
        <History />
      </Button>
      <Button
        size="medium"
        variant="outlined"
        sx={{ bgcolor: "background.paper" }}
        startIcon={<CheckCircleOutline />}
      >
        <Typography variant="body2" fontWeight={600} color="inherit" noWrap>
          Pubblica in App IO
        </Typography>
      </Button>
    </Stack>
  );
};
