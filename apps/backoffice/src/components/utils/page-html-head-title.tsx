import { useTranslation } from "next-i18next";
import Head from "next/head";

export type PageHtmlHeadTitleProps = {
  section: string;
};

export const PageHtmlHeadTitle = ({ section }: PageHtmlHeadTitleProps) => {
  const { t } = useTranslation();
  return (
    <Head>
      <title>
        {t("app.title")} | {t(`section.${section}`)}
      </title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </Head>
  );
};
