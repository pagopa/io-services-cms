import { getConfiguration } from "@/config";
import {
  Footer,
  FooterLinksType,
  LangCode,
  Languages,
  PreLoginFooterLinksType,
  RootLinkType,
} from "@pagopa/mui-italia";
import { useRouter } from "next/router";
import { Trans, useTranslation } from "next-i18next";
import { useCallback, useEffect, useState } from "react";

const pagoPACompanyLabel = "PagoPa S.p.A.";

const pagoPALink: RootLinkType = {
  ariaLabel: pagoPACompanyLabel,
  href: "https://www.pagopa.it/it/",
  label: pagoPACompanyLabel,
  title: pagoPACompanyLabel,
};

const companyLegalInfo = <Trans i18nKey="footer.legalInfo" />;

const supportedLocales = ["it", "en"];
const languages: Languages = {
  en: {
    en: "English",
    it: "Italian",
  },
  it: {
    en: "Inglese",
    it: "Italiano",
  },
};

export interface AppFooterProps {
  currentLanguage: LangCode;
  loggedUser: boolean;
}

export const AppFooter = ({ currentLanguage, loggedUser }: AppFooterProps) => {
  const { t } = useTranslation();
  const config = getConfiguration();
  const router = useRouter();
  const [lang, setLang] = useState(currentLanguage);

  const postLoginLinks: FooterLinksType[] = [
    {
      ariaLabel: t("footer.postLogin.privacyPolicy"),
      href: config.BACK_OFFICE_PRIVACY_POLICY_URL,
      label: t("footer.postLogin.privacyPolicy"),
      linkType: "internal",
    },
    {
      ariaLabel: t("footer.postLogin.personalDataProtection"),
      href: config.BACK_OFFICE_PERS_DATA_PROTECTION_URL,
      label: t("footer.postLogin.personalDataProtection"),
      linkType: "internal",
    },
    {
      ariaLabel: t("footer.postLogin.termsAndConditions"),
      href: config.BACK_OFFICE_TOS_URL,
      label: t("footer.postLogin.termsAndConditions"),
      linkType: "internal",
    },
  ];

  const preLoginLinks: PreLoginFooterLinksType = {
    // First column
    aboutUs: {
      links: [],
      title: undefined,
    },
    // Fourth column
    followUs: {
      links: [],
      socialLinks: [],
      title: "",
    },
    // Third column
    resources: {
      links: [],
      title: undefined,
    },
  };

  const switchToLocale = useCallback(
    (locale: string) => {
      const path = router.asPath;
      return router.push(path, path, { locale });
    },
    [router],
  );

  useEffect(() => {
    // Detect the browser's preferred language
    const browserLanguage = navigator.language;

    if (supportedLocales.includes(browserLanguage)) {
      setLang(browserLanguage as any);
    }
  }, []);

  return (
    <Footer
      companyLink={pagoPALink}
      currentLangCode={lang}
      languages={languages}
      legalInfo={companyLegalInfo}
      loggedUser={loggedUser}
      onLanguageChanged={(language: LangCode) => {
        setLang(language);
        switchToLocale(language);
      }}
      postLoginLinks={postLoginLinks}
      preLoginLinks={preLoginLinks}
    />
  );
};
