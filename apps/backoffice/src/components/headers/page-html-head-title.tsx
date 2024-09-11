import Head from "next/head";
import { useTranslation } from "next-i18next";

export interface PageHtmlHeadTitleProps {
  section: string;
}

export const PageHtmlHeadTitle = ({ section }: PageHtmlHeadTitleProps) => {
  const { t } = useTranslation();

  const getTitle = () => `${t("app.title")} | ${t(section)}`;

  return (
    <Head>
      <title>{getTitle()}</title>
      <meta content="width=device-width, initial-scale=1" name="viewport" />
    </Head>
  );
};
