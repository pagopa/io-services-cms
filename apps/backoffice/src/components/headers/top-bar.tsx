import { HeaderAccount, JwtUser, RootLinkType } from "@pagopa/mui-italia";

const pagoPACompanyLabel = "PagoPa S.p.A.";

const pagoPALink: RootLinkType = {
  ariaLabel: pagoPACompanyLabel,
  href: "https://www.pagopa.it/it/",
  label: pagoPACompanyLabel,
  title: pagoPACompanyLabel,
};

export type TopBarProps = {
  user: false | JwtUser | undefined;
};

export const TopBar = ({ user }: TopBarProps) => {
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
    />
  );
};
