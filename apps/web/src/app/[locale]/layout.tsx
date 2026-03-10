import { notFound } from "next/navigation";
import { isValidLocale, locales } from "@/lib/i18n-config";
import { SetLocale } from "@/components/set-locale";

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  return (
    <>
      <SetLocale locale={locale} />
      {children}
    </>
  );
}
