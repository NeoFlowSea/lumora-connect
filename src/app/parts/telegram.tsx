import { useEffect, useState } from "react";
import { Check, ExternalLink, Send } from "lucide-react";
import { api } from "../../api";
import { useSession } from "../../api/hooks";
import { ErrorNote, Spinner } from "../../components/form";
import { btn } from "../../components/ui";
import { lumora } from "../../content/lumora";
import { t, useLang } from "../../i18n";

/* Connect Telegram to the account through the Lumora bot (supabase/functions/tg-bot).
   The button opens t.me/Lumora_connect_bot?start=<one-time code>; the bot saves the Telegram
   account, and Realtime refreshes the page, so the state changes without a reload.
   The code is fetched before the click, so the link opens straight away (no popup blocker). */

export function useTelegramLink() {
  useSession();
  return api.telegram.link();
}

export function ConnectTelegramButton({ primary = true }: { primary?: boolean }) {
  useLang();
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);
  useEffect(() => {
    let live = true;
    api.telegram
      .code()
      .then((c) => live && setCode(c))
      .catch((e: Error) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, []);
  return (
    <div className="grid gap-2">
      <a
        href={code ? `${lumora.links.bot}?start=${code}` : undefined}
        aria-disabled={!code}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => setOpened(true)}
        className={`${primary ? btn.primary : btn.ghost} w-fit ${code ? "" : "pointer-events-none opacity-60"}`}
      >
        {code || error ? <Send size={16} /> : <Spinner />} {t("app.tg.connect")} <ExternalLink size={14} />
      </a>
      <p className="text-[13px] text-mist">{opened ? t("app.tg.waiting") : t("app.tg.hint")}</p>
      <ErrorNote>{error}</ErrorNote>
    </div>
  );
}

/** "Telegram: @name" when connected, otherwise the connect button */
export function TelegramStatus({ primary = false }: { primary?: boolean }) {
  useLang();
  const link = useTelegramLink();
  if (link) {
    return (
      <p className="flex flex-wrap items-center gap-2 text-[14px]">
        <span className="inline-flex items-center gap-1.5 font-semibold text-good">
          <Check size={16} /> {t("app.tg.connected")}
        </span>
        <span className="text-mist">{link.username ? `@${link.username}` : t("app.tg.noUsername")}</span>
      </p>
    );
  }
  return <ConnectTelegramButton primary={primary} />;
}
