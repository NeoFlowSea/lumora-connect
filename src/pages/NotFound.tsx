import { useLang } from "../i18n";
import { btn } from "../components/ui";

export function NotFound() {
  const { t } = useLang();
  return (
    <div className="mx-auto grid min-h-[60svh] max-w-[560px] place-content-center px-5 py-24 text-center">
      <div className="text-[64px] font-semibold leading-none text-sky">404</div>
      <h1 className="mt-4 text-[28px]">{t("common.notFound.title")}</h1>
      <p className="mt-3 text-mist">{t("common.notFound.text")}</p>
      <a href="#/" className={`${btn.primary} mx-auto mt-8`}>
        {t("common.notFound.home")}
      </a>
    </div>
  );
}
