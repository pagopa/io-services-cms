import { useTranslation } from "next-i18next";
import Head from "next/head";

export type PageHtmlHeadTitleProps = {
  section: string;
};

export const PageHtmlHeadTitle = ({ section }: PageHtmlHeadTitleProps) => {
  const { t } = useTranslation();

  const getTitle = () => `${t("app.title")} | ${t(section)}`;

  return (
    <Head>
      <title>{getTitle()}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </Head>
  );
};
