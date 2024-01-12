import { getConfiguration } from "@/config";
import {
  Footer,
  FooterLinksType,
  LangCode,
  Languages,
  PreLoginFooterLinksType,
  RootLinkType
} from "@pagopa/mui-italia";
import { Trans, useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";

const pagoPACompanyLabel = "PagoPa S.p.A.";

const pagoPALink: RootLinkType = {
  ariaLabel: pagoPACompanyLabel,
  href: "https://www.pagopa.it/it/",
  label: pagoPACompanyLabel,
  title: pagoPACompanyLabel
};

const companyLegalInfo = <Trans i18nKey="footer.legalInfo" />;

const supportedLocales = ["it", "en"];
const languages: Languages = {
  it: {
    it: "Italiano",
    en: "Inglese"
  },
  en: {
    it: "Italian",
    en: "English"
  }
};

export type AppFooterProps = {
  loggedUser: boolean;
  currentLanguage: LangCode;
};

export const AppFooter = ({ loggedUser, currentLanguage }: AppFooterProps) => {
  const { t } = useTranslation();
  const config = getConfiguration();
  const router = useRouter();
  const [lang, setLang] = useState(currentLanguage);

  const postLoginLinks: Array<FooterLinksType> = [
    {
      label: t("footer.postLogin.privacyPolicy"),
      href: config.BACK_OFFICE_PRIVACY_POLICY_URL,
      ariaLabel: t("footer.postLogin.privacyPolicy"),
      linkType: "internal"
    },
    {
      label: t("footer.postLogin.personalDataProtection"),
      href: config.BACK_OFFICE_PERS_DATA_PROTECTION_URL,
      ariaLabel: t("footer.postLogin.personalDataProtection"),
      linkType: "internal"
    },
    {
      label: t("footer.postLogin.termsAndConditions"),
      href: config.BACK_OFFICE_TOS_URL,
      ariaLabel: t("footer.postLogin.termsAndConditions"),
      linkType: "internal"
    }
  ];

  const preLoginLinks: PreLoginFooterLinksType = {
    // First column
    aboutUs: {
      title: undefined,
      links: []
    },
    // Third column
    resources: {
      title: undefined,
      links: []
    },
    // Fourth column
    followUs: {
      title: "",
      socialLinks: [],
      links: []
    }
  };

  const switchToLocale = useCallback(
    (locale: string) => {
      const path = router.asPath;
      return router.push(path, path, { locale });
    },
    [router]
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
    />
  );
};
