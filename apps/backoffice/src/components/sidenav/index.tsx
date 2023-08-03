import {
  Dashboard,
  ExitToAppRounded,
  NoteAlt,
  People,
  SupervisedUserCircle,
  VpnKey,
} from "@mui/icons-material";
import {
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import NextLink from "next/link";
import { useRouter } from "next/router";

export type SidenavItem = {
  href: string;
  icon: JSX.Element | null;
  text: string;
};

export type SidenavProps = {
  onNavItemClick: (itemIndex: number) => void;
};

export const Sidenav = ({ onNavItemClick }: SidenavProps) => {
  const router = useRouter();

  const menu: Array<SidenavItem> = [
    {
      href: "/",
      icon: <Dashboard fontSize="inherit" />,
      text: "Panoramica",
    },
    {
      href: "/services",
      icon: <NoteAlt fontSize="inherit" />,
      text: "Servizi",
    },
    {
      href: "/apikeys",
      icon: <VpnKey fontSize="inherit" />,
      text: "API Key",
    },
  ];

  const handleListItemClick = (index: number) => {
    onNavItemClick(index);
  };

  return (
    <Box
      sx={{
        height: "100%",
        maxWidth: 360,
        backgroundColor: "background.paper",
      }}
    >
      <List component="nav" aria-label="menu-back-office">
        {menu.map((item, index) => (
          <NextLink key={index} href={item.href} passHref>
            <ListItemButton
              selected={
                router.pathname === item.href ||
                (item.href.length > 1 && router.pathname.startsWith(item.href))
              }
              onClick={() => handleListItemClick(index)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </NextLink>
        ))}
      </List>

      <Divider />

      <List component="nav" aria-label="secondary todo">
        <NextLink href="" passHref onClick={() => console.log("Utenti click")}>
          <ListItemButton>
            <ListItemIcon>
              <People fontSize="inherit" />
            </ListItemIcon>
            <ListItemText primary="Utenti" />
            <ListItemIcon>
              <ExitToAppRounded color="action" />
            </ListItemIcon>
          </ListItemButton>
        </NextLink>
        <NextLink href="" passHref onClick={() => console.log("Gruppi click")}>
          <ListItemButton>
            <ListItemIcon>
              <SupervisedUserCircle fontSize="inherit" />
            </ListItemIcon>
            <ListItemText primary="Gruppi" />
            <ListItemIcon>
              <ExitToAppRounded color="action" />
            </ListItemIcon>
          </ListItemButton>
        </NextLink>
      </List>
    </Box>
  );
};
