import { HeaderAccount, JwtUser, RootLinkType } from "@pagopa/mui-italia";
import { useRouter } from "next/router";

const pagoPACompanyLabel = "PagoPa S.p.A.";

const pagoPALink: RootLinkType = {
  ariaLabel: pagoPACompanyLabel,
  href: "https://www.pagopa.it/it/",
  label: pagoPACompanyLabel,
  title: pagoPACompanyLabel
};

export type TopBarProps = {
  user: false | JwtUser | undefined;
};

export const TopBar = ({ user }: TopBarProps) => {
  const router = useRouter();

  return (
    <HeaderAccount
      rootLink={pagoPALink}
      loggedUser={user}
      onAssistanceClick={() => {
        console.log("Clicked/Tapped on Assistance");
      }}
      onDocumentationClick={() => {
        console.log("Clicked/Tapped on Documentation");
      }}
      onLogin={() => {
        console.log("User login");
      }}
      onLogout={() => router.push("/auth/logout")}
    />
  );
};
