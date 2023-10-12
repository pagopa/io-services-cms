import { AppFooter } from "@/components/footer";
import { Header, TopBar } from "@/components/headers";
import { Sidenav, SidenavItem } from "@/components/sidenav";
import {
  Category,
  People,
  SupervisedUserCircle,
  ViewSidebar,
  VpnKey
} from "@mui/icons-material";
import { Box, Grid } from "@mui/material";
import { useSession } from "next-auth/react";
import { ReactNode, useState } from "react";

import styles from "@/styles/app-layout.module.css";

type AppLayoutProps = {
  hideSidenav?: boolean;
  children: ReactNode;
};

/** List of sidenav menu items _(displayed on left side column)_ */
const menu: Array<SidenavItem> = [
  {
    href: "/",
    icon: <ViewSidebar fontSize="inherit" />,
    text: "routes.overview.title",
    linkType: "internal"
  },
  {
    href: "/services",
    icon: <Category fontSize="inherit" />,
    text: "routes.services.title",
    linkType: "internal"
  },
  {
    href: "/keys",
    icon: <VpnKey fontSize="inherit" />,
    text: "routes.keys.title",
    linkType: "internal",
    hasBottomDivider: true,
    requiredPermissions: ["ApiServiceWrite"]
  },
  {
    href: "",
    icon: <People fontSize="inherit" />,
    text: "routes.users.title",
    linkType: "external"
  },
  {
    href: "",
    icon: <SupervisedUserCircle fontSize="inherit" />,
    text: "routes.groups.title",
    linkType: "external"
  }
];

export const AppLayout = ({ hideSidenav, children }: AppLayoutProps) => {
  const { data: session } = useSession();
  const [sidenavWidth, setSidenavWidth] = useState(320);

  return (
    <Box>
      <Box>
        <TopBar user={session?.user ? { id: session.user.id } : undefined} />
      </Box>
      <Box>
        <Header />
      </Box>
      <Grid container spacing={0} bgcolor={"#F5F5F5"}>
        {hideSidenav ? null : (
          <Grid item width={sidenavWidth}>
            <Sidenav items={menu} onWidthChange={setSidenavWidth} />
          </Grid>
        )}
        <Grid item className={styles.main}>
          {children}
        </Grid>
      </Grid>
      <Box>
        <AppFooter loggedUser={true} currentLanguage={"it"} />
      </Box>
    </Box>
  );
};
