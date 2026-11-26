// Lumora bot (@Lumora_connect_bot): confirms that a site account is subscribed to the Lumora
// Telegram channel. Deployed as the Supabase Edge Function "tg-bot" with JWT verification off,
// because Telegram calls it directly; Telegram's calls carry a secret header instead.
//
// Secrets (Edge Functions > Secrets): TELEGRAM_BOT_TOKEN. SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.
//
// Calls:
// - from Telegram (webhook): /start <code> or the "I subscribed" button -> check the channel
// - from the site, signed in: { action: "recheck" } -> check again with the Telegram account
//   that confirmed before
// - from the site, signed in as an admin: { action: "setup" } -> point the bot's webhook here
//   and report whether the bot can see the channel

import { createClient } from "npm:@supabase/supabase-js@2";

const TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const PROJECT_URL = "https://ijynoxlgcpsckrepbyhw.supabase.co";
const CHANNEL = "@thelumoraa";
const CHANNEL_URL = "https://t.me/thelumoraa";
const SITE = "https://neoflowsea.github.io/lumora-connect/v5-backend/#/app/hackathons";

const db = createClient(Deno.env.get("SUPABASE_URL") ?? PROJECT_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
  auth: { persistSession: false, autoRefreshToken: false },
});

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });

/** the webhook secret is derived from the bot token, so there is only one secret to keep */
async function webhookSecret(): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`lumora-webhook:${TOKEN}`));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 48);
}

async function tg(method: string, body: Record<string, unknown>) {
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await r.json()) as { ok: boolean; result?: any; description?: string };
}

/** true / false, or null when Telegram would not say (the bot is not an admin of the channel) */
async function inChannel(tgId: number): Promise<boolean | null> {
  const r = await tg("getChatMember", { chat_id: CHANNEL, user_id: tgId });
  if (!r.ok) return null;
  const s = r.result.status;
  return s === "creator" || s === "administrator" || s === "member" || (s === "restricted" && r.result.is_member === true);
}

type Lang = "ru" | "uz" | "en";
const pickLang = (code?: string): Lang => (code?.startsWith("uz") ? "uz" : code?.startsWith("en") ? "en" : "ru");

const TEXT: Record<string, Record<Lang, string>> = {
  hello: {
    ru: "Это бот Lumora. Он подтверждает подписку на канал для регистрации на хакатоны. Откройте страницу события на сайте и нажмите «Подтвердить через бота».",
    uz: "Bu Lumora boti. U xakatonlarga ro'yxatdan o'tish uchun kanalga obunani tasdiqlaydi. Saytda tadbir sahifasini oching va «Bot orqali tasdiqlash» tugmasini bosing.",
    en: "This is the Lumora bot. It confirms your channel subscription for hackathon registration. Open the event page on the site and tap \"Confirm with the bot\".",
  },
  expired: {
    ru: "Эта ссылка устарела. Вернитесь на сайт и нажмите «Подтвердить через бота» ещё раз.",
    uz: "Bu havola eskirgan. Saytga qayting va «Bot orqali tasdiqlash» tugmasini yana bosing.",
    en: "This link has expired. Go back to the site and tap \"Confirm with the bot\" again.",
  },
  notYet: {
    ru: "Пока не видим подписки на канал Lumora. Подпишитесь и нажмите «Я подписался».",
    uz: "Lumora kanaliga obunangiz hali ko'rinmayapti. Obuna bo'ling va «Obuna bo'ldim» tugmasini bosing.",
    en: "We can't see a subscription to the Lumora channel yet. Subscribe, then tap \"I subscribed\".",
  },
  done: {
    ru: "Готово, подписка подтверждена. Вернитесь на сайт: регистрация на хакатон открыта.",
    uz: "Tayyor, obuna tasdiqlandi. Saytga qayting: xakatonga ro'yxatdan o'tish ochiq.",
    en: "Done, your subscription is confirmed. Go back to the site: hackathon registration is open.",
  },
  broken: {
    ru: "Не получилось проверить канал. Мы уже разбираемся, попробуйте чуть позже.",
    uz: "Kanalni tekshirib bo'lmadi. Muammoni hal qilyapmiz, birozdan keyin urinib ko'ring.",
    en: "We couldn't check the channel. We're on it, please try again a bit later.",
  },
  openChannel: { ru: "Открыть канал", uz: "Kanalni ochish", en: "Open the channel" },
  subscribed: { ru: "Я подписался", uz: "Obuna bo'ldim", en: "I subscribed" },
  backToSite: { ru: "Вернуться на сайт", uz: "Saytga qaytish", en: "Back to the site" },
};

async function say(chatId: number, lang: Lang, key: string, buttons?: { text: string; url?: string; callback_data?: string }[][]) {
  await tg("sendMessage", { chat_id: chatId, text: TEXT[key][lang], ...(buttons ? { reply_markup: { inline_keyboard: buttons } } : {}) });
}

async function confirm(userId: string) {
  await db.from("profiles").update({ channel_ok_at: new Date().toISOString() }).eq("id", userId);
}

/** a person opened the bot with a code from the site, or pressed "I subscribed" */
async function handleCode(code: string, from: { id: number; language_code?: string }, chatId: number) {
  const lang = pickLang(from.language_code);
  const { data: row } = await db.from("channel_codes").select("user_id").eq("code", code).maybeSingle();
  if (!row) return say(chatId, lang, "expired");
  await db.from("tg_links").upsert({ user_id: row.user_id, tg_id: from.id, at: new Date().toISOString() });
  const ok = await inChannel(from.id);
  if (ok === null) return say(chatId, lang, "broken");
  if (!ok) {
    return say(chatId, lang, "notYet", [[{ text: TEXT.openChannel[lang], url: CHANNEL_URL }], [{ text: TEXT.subscribed[lang], callback_data: `c:${code}` }]]);
  }
  await confirm(row.user_id);
  await db.from("channel_codes").delete().eq("code", code);
  return say(chatId, lang, "done", [[{ text: TEXT.backToSite[lang], url: SITE }]]);
}

/** the signed-in site user behind a request, or null */
async function siteUser(req: Request) {
  const jwt = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!jwt) return null;
  const { data } = await db.auth.getUser(jwt);
  return data.user ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (!TOKEN) return json({ error: "TELEGRAM_BOT_TOKEN is not set" }, 500);

  const telegramSecret = req.headers.get("x-telegram-bot-api-secret-token");

  // ---------- from Telegram ----------
  if (telegramSecret !== null) {
    if (telegramSecret !== (await webhookSecret())) return new Response("forbidden", { status: 403 });
    const u = await req.json().catch(() => ({}));
    try {
      const msg = u.message;
      if (msg?.text?.startsWith("/start")) {
        const code = msg.text.split(/\s+/)[1];
        if (code) await handleCode(code, msg.from, msg.chat.id);
        else await say(msg.chat.id, pickLang(msg.from?.language_code), "hello");
      } else if (msg?.chat?.type === "private") {
        await say(msg.chat.id, pickLang(msg.from?.language_code), "hello");
      }
      const cb = u.callback_query;
      if (cb?.data?.startsWith("c:")) {
        await tg("answerCallbackQuery", { callback_query_id: cb.id });
        await handleCode(cb.data.slice(2), cb.from, cb.message.chat.id);
      }
    } catch (e) {
      console.error(e);
    }
    // always 200, or Telegram keeps resending the same update
    return new Response("ok");
  }

  // ---------- from the site ----------
  const user = await siteUser(req);
  if (!user) return json({ error: "signInFirst" }, 401);
  const body = await req.json().catch(() => ({}));

  if (body.action === "recheck") {
    const { data: link } = await db.from("tg_links").select("tg_id").eq("user_id", user.id).maybeSingle();
    if (!link) return json({ status: "no_link" });
    const ok = await inChannel(link.tg_id);
    if (ok === null) return json({ status: "broken" });
    if (ok) await confirm(user.id);
    else await db.from("profiles").update({ channel_ok_at: null }).eq("id", user.id);
    return json({ status: ok ? "member" : "not_member" });
  }

  if (body.action === "setup") {
    const { data: p } = await db.from("profiles").select("kind").eq("id", user.id).maybeSingle();
    if (p?.kind !== "admin") return json({ error: "notAdmin" }, 403);
    const hook = await tg("setWebhook", {
      url: `${PROJECT_URL}/functions/v1/tg-bot`,
      secret_token: await webhookSecret(),
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: true,
    });
    const me = await tg("getMe", {});
    const admin = me.ok ? await tg("getChatMember", { chat_id: CHANNEL, user_id: me.result.id }) : { ok: false, description: me.description };
    return json({
      webhook: hook.ok ? "set" : hook.description,
      bot: me.ok ? `@${me.result.username}` : me.description,
      botInChannel: admin.ok ? admin.result.status : admin.description,
    });
  }

  return json({ error: "unknown action" }, 400);
});
