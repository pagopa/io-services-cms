import { AppFooter } from "@/components/footer";
import { Header, TopBar } from "@/components/headers";
import { Sidenav } from "@/components/sidenav";
import { Box, Grid } from "@mui/material";
import { useSession } from "next-auth/react";
import { ReactNode, useState } from "react";

import styles from "@/styles/app-layout.module.css";

type AppLayoutProps = {
  hideSidenav?: boolean;
  children: ReactNode;
};

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
            <Sidenav onWidthChange={setSidenavWidth} />
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
