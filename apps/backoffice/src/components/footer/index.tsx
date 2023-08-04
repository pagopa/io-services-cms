import { useCallback, useState } from "react";
import { Trans, useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import {
  Footer,
  FooterLinksType,
  LangCode,
  Languages,
  PreLoginFooterLinksType,
  RootLinkType,
} from "@pagopa/mui-italia";

const pagoPACompanyLabel = "PagoPa S.p.A.";

const pagoPALink: RootLinkType = {
  ariaLabel: pagoPACompanyLabel,
  href: "https://www.pagopa.it/it/",
  label: pagoPACompanyLabel,
  title: pagoPACompanyLabel,
};

const companyLegalInfo = <Trans i18nKey="footer.legalInfo" />;

const languages: Languages = {
  it: {
    it: "Italiano",
    en: "Inglese",
  },
  en: {
    it: "Italian",
    en: "English",
  },
};

export type AppFooterProps = {
  loggedUser: boolean;
  currentLanguage: LangCode;
};

export const AppFooter = ({ loggedUser, currentLanguage }: AppFooterProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const [lang, setLang] = useState(currentLanguage);

  const postLoginLinks: Array<FooterLinksType> = [
    {
      label: t("footer.postLogin.privacyPolicy"),
      href: "",
      ariaLabel: "Vai al link: Privacy policy",
      linkType: "internal",
    },
    {
      label: t("footer.postLogin.personalDataProtection"),
      href: "",
      ariaLabel: "Vai al link: Diritto alla protezione dei dati personali",
      linkType: "internal",
    },
    {
      label: t("footer.postLogin.termsAndConditions"),
      href: "",
      ariaLabel: "Vai al link: Termini e condizioni",
      linkType: "internal",
    },
  ];

  const preLoginLinks: PreLoginFooterLinksType = {
    // First column
    aboutUs: {
      title: undefined,
      links: [],
    },
    // Third column
    resources: {
      title: undefined,
      links: [],
    },
    // Fourth column
    followUs: {
      title: "",
      socialLinks: [],
      links: [],
    },
  };

  const switchToLocale = useCallback(
    (locale: string) => {
      const path = router.asPath;
      return router.push(path, path, { locale });
    },
    [router]
  );

  return (
    <Footer
      loggedUser={loggedUser}
      companyLink={pagoPALink}
      legalInfo={companyLegalInfo}
      postLoginLinks={postLoginLinks}
      preLoginLinks={preLoginLinks}
      currentLangCode={lang}
      onLanguageChanged={(language: LangCode) => {
        setLang(language);
        switchToLocale(language);
      }}
      languages={languages}
      productsJsonUrl="https://dev.selfcare.pagopa.it/assets/products.json"
      hideProductsColumn={false}
    />
  );
};
