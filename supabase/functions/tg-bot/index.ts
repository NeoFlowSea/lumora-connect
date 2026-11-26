// Lumora bot (@Lumora_connect_bot). Deployed as the Supabase Edge Function "tg-bot" with JWT
// verification off, because Telegram calls it directly; Telegram's calls carry a secret header.
//
// Secrets (Edge Functions > Secrets): TELEGRAM_BOT_TOKEN. SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.
//
// From Telegram (webhook):
//   /start <code>     connect this Telegram to a site account (code from channel_code())
//   /start t_<code>   confirm a place in a team before the event (code = teams.confirm_code)
//   buttons           t:<code> check again, m:<code> a small team agrees to be merged
// From the site, signed in:
//   { action: "recheck" }                   check the channel again for the connected Telegram
//   { action: "setup" }          (admin)    point the bot's webhook here, report the channel
//   { action: "request_confirm", hid }  (admin)  ask every team of an event to confirm
// The database side is supabase/migrations/0004 and 0005.

import { createClient } from "npm:@supabase/supabase-js@2";

const TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const PROJECT_URL = "https://ijynoxlgcpsckrepbyhw.supabase.co";
const BOT = "Lumora_connect_bot";
const CHANNEL = "@thelumoraa";
const CHANNEL_URL = "https://t.me/thelumoraa";
const SITE = "https://neoflowsea.github.io/lumora-connect/v5-backend/";

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

// deno-lint-ignore no-explicit-any
async function tg(method: string, body: Record<string, unknown>): Promise<{ ok: boolean; result?: any; description?: string }> {
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return await r.json();
}

/** true / false, or null when Telegram would not say (the bot is not an admin of the channel) */
async function inChannel(tgId: number): Promise<boolean | null> {
  const r = await tg("getChatMember", { chat_id: CHANNEL, user_id: tgId });
  if (!r.ok) return null;
  const s = r.result.status;
  return s === "creator" || s === "administrator" || s === "member" || (s === "restricted" && r.result.is_member === true);
}

/* ---------- texts ---------- */

type Lang = "ru" | "uz" | "en";
const pickLang = (code?: string): Lang => (code?.startsWith("uz") ? "uz" : code?.startsWith("en") ? "en" : "ru");
type Vars = Record<string, string | number>;
const fill = (s: string, v: Vars = {}) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));

const TEXT: Record<string, Record<Lang, string>> = {
  hello: {
    ru: "Это бот Lumora. Через него подключают Telegram к аккаунту Lumora и подтверждают участие команды в хакатоне. Ссылки приходят с сайта и от тимлида.",
    uz: "Bu Lumora boti. U orqali Telegram Lumora akkauntiga ulanadi va jamoaning xakatonda qatnashishi tasdiqlanadi. Havolalar saytdan va jamoa sardoridan keladi.",
    en: "This is the Lumora bot. It connects Telegram to your Lumora account and confirms your team's place at a hackathon. Links come from the site and from your team lead.",
  },
  expired: {
    ru: "Эта ссылка устарела. Вернитесь на сайт и нажмите кнопку ещё раз.",
    uz: "Bu havola eskirgan. Saytga qayting va tugmani yana bosing.",
    en: "This link has expired. Go back to the site and tap the button again.",
  },
  linked: {
    ru: "Готово, Telegram подключён к аккаунту Lumora. Вернитесь на сайт.",
    uz: "Tayyor, Telegram Lumora akkauntiga ulandi. Saytga qayting.",
    en: "Done, Telegram is connected to your Lumora account. Go back to the site.",
  },
  linkedTeams: {
    ru: "Мы нашли вас в заявке: {teams}. Команда уже видна в вашем аккаунте.",
    uz: "Sizni arizada topdik: {teams}. Jamoa akkauntingizda ko'rinadi.",
    en: "We found you in a registration: {teams}. The team is already in your account.",
  },
  noUsername: {
    ru: "У вашего Telegram нет юзернейма, поэтому по заявкам команд вас не найти. Его можно задать в настройках Telegram.",
    uz: "Telegramingizda username yo'q, shuning uchun jamoa arizalarida sizni topib bo'lmaydi. Uni Telegram sozlamalarida qo'yish mumkin.",
    en: "Your Telegram has no username, so team registrations can't find you. You can set one in Telegram settings.",
  },
  takenTg: {
    ru: "Этот Telegram уже подключён к другому аккаунту Lumora. Войдите в тот аккаунт или напишите организаторам.",
    uz: "Bu Telegram boshqa Lumora akkauntiga ulangan. O'sha akkauntga kiring yoki tashkilotchilarga yozing.",
    en: "This Telegram is already connected to another Lumora account. Sign in to that account or write to the organizers.",
  },
  notInTeam: {
    ru: "Не нашли @{u} в команде «{team}». Попросите тимлида добавить ваш юзернейм в заявку на сайте, потом откройте ссылку снова.",
    uz: "«{team}» jamoasida @{u} topilmadi. Jamoa sardoridan saytdagi arizaga username'ingizni qo'shishni so'rang, keyin havolani qayta oching.",
    en: "We couldn't find @{u} in team \"{team}\". Ask your team lead to add your username to the registration on the site, then open the link again.",
  },
  notInTeamNoUser: {
    ru: "У вашего Telegram нет юзернейма, поэтому мы не можем найти вас в команде «{team}». Задайте юзернейм в настройках Telegram и попросите тимлида добавить его в заявку.",
    uz: "Telegramingizda username yo'q, shuning uchun sizni «{team}» jamoasida topa olmaymiz. Telegram sozlamalarida username qo'ying va jamoa sardoridan uni arizaga qo'shishni so'rang.",
    en: "Your Telegram has no username, so we can't find you in team \"{team}\". Set one in Telegram settings and ask your team lead to add it to the registration.",
  },
  needChannel: {
    ru: "Чтобы подтвердить участие, подпишитесь на канал Lumora: там будут кейс, расписание и все новости в день хакатона. Потом нажмите «Я подписался».",
    uz: "Qatnashishni tasdiqlash uchun Lumora kanaliga obuna bo'ling: keys, jadval va xakaton kunidagi barcha yangiliklar o'sha yerda bo'ladi. Keyin «Obuna bo'ldim» tugmasini bosing.",
    en: "To confirm, subscribe to the Lumora channel: the case, the schedule and all news on the day will be there. Then tap \"I subscribed\".",
  },
  confirmedWaiting: {
    ru: "Вы подтверждены в команде «{team}». Подтвердились {n} из минимум {min}. Перешлите ссылку остальным: {link}",
    uz: "Siz «{team}» jamoasida tasdiqlandingiz. {n} kishi tasdiqladi, kamida {min} kerak. Havolani qolganlarga yuboring: {link}",
    en: "You're confirmed in team \"{team}\". {n} of at least {min} have confirmed. Send the link to the rest: {link}",
  },
  invite: {
    ru: "Приглашение на {title}\n\nКоманда: {team}\nКогда: {when}\nГде: {where}{agenda}\n\nВсе детали и изменения будут в канале @thelumoraa и на сайте: {url}",
    uz: "{title} ga taklifnoma\n\nJamoa: {team}\nQachon: {when}\nQayerda: {where}{agenda}\n\nBarcha tafsilotlar va o'zgarishlar @thelumoraa kanalida va saytda: {url}",
    en: "Invitation to {title}\n\nTeam: {team}\nWhen: {when}\nWhere: {where}{agenda}\n\nAll details and changes will be in @thelumoraa and on the site: {url}",
  },
  agenda: { ru: "\n\nРасписание:\n", uz: "\n\nJadval:\n", en: "\n\nSchedule:\n" },
  account: {
    ru: "В аккаунте Lumora будут видны место команды и результаты. Создать его можно через Telegram: {url}",
    uz: "Lumora akkauntida jamoa o'rni va natijalar ko'rinadi. Uni Telegram orqali ochish mumkin: {url}",
    en: "Your Lumora account will show your team's place and results. You can create it with Telegram: {url}",
  },
  askLead: {
    ru: "Привет! До {title} осталось несколько дней ({when}). Подтвердите участие команды «{team}».\n\n1. Нажмите «Подтвердить участие».\n2. Перешлите эту ссылку участникам: {link}\nКаждый открывает её в своём Telegram и подписывается на @thelumoraa.\n\nНужно минимум {min} человек. Если вас будет меньше, нажмите «Нас меньше {min}», и организаторы объединят вас с другой небольшой командой.",
    uz: "Salom! {title} ga bir necha kun qoldi ({when}). «{team}» jamoasining qatnashishini tasdiqlang.\n\n1. «Qatnashishni tasdiqlash» tugmasini bosing.\n2. Bu havolani a'zolarga yuboring: {link}\nHar kim uni o'z Telegramida ochadi va @thelumoraa ga obuna bo'ladi.\n\nKamida {min} kishi kerak. Kamroq bo'lsangiz, «Bizdan {min} kishidan kam» tugmasini bosing, tashkilotchilar sizni boshqa kichik jamoa bilan birlashtiradi.",
    en: "Hi! {title} is in a few days ({when}). Please confirm team \"{team}\".\n\n1. Tap \"Confirm our place\".\n2. Send this link to your members: {link}\nEach of them opens it in their own Telegram and subscribes to @thelumoraa.\n\nYou need at least {min} people. If you'll be fewer, tap \"We're fewer than {min}\" and the organizers will merge you with another small team.",
  },
  mergeAsk: {
    ru: "Вас будет меньше {min}? Организаторы могут объединить вас с другой небольшой командой, чтобы вы всё равно участвовали. Вы и ваши участники согласны?",
    uz: "Sizdan {min} kishidan kam bo'ladimi? Tashkilotchilar sizni boshqa kichik jamoa bilan birlashtirishi mumkin, shunda baribir qatnashasiz. Siz va a'zolaringiz rozimisiz?",
    en: "Will you be fewer than {min}? The organizers can merge you with another small team so you still take part. Do you and your members agree?",
  },
  mergeNo: {
    ru: "Хорошо, не объединяем. Чтобы участвовать, до дедлайна должны подтвердиться минимум {min} человек из команды.",
    uz: "Yaxshi, birlashtirmaymiz. Qatnashish uchun muddatgacha jamoadan kamida {min} kishi tasdiqlashi kerak.",
    en: "OK, we won't merge you. To take part, at least {min} people from your team need to confirm before the deadline.",
  },
  yesMerge: { ru: "Да, согласны", uz: "Ha, rozimiz", en: "Yes, we agree" },
  noMerge: { ru: "Нет, соберём команду сами", uz: "Yo'q, jamoani o'zimiz yig'amiz", en: "No, we'll gather the team ourselves" },
  mergeOk: {
    ru: "Записали: вы согласны, чтобы организаторы объединили вас с другой командой. Мы напишем, когда подберём.",
    uz: "Yozib oldik: tashkilotchilar sizni boshqa jamoa bilan birlashtirishiga rozisiz. Topganimizda yozamiz.",
    en: "Noted: you agree to be merged with another team. We'll write once we find one.",
  },
  onlyLead: {
    ru: "Это может сделать только тимлид команды.",
    uz: "Buni faqat jamoa sardori qila oladi.",
    en: "Only the team lead can do this.",
  },
  broken: {
    ru: "Не получилось проверить канал. Мы уже разбираемся, попробуйте чуть позже.",
    uz: "Kanalni tekshirib bo'lmadi. Muammoni hal qilyapmiz, birozdan keyin urinib ko'ring.",
    en: "We couldn't check the channel. We're on it, please try again a bit later.",
  },
  openChannel: { ru: "Открыть канал", uz: "Kanalni ochish", en: "Open the channel" },
  subscribed: { ru: "Я подписался", uz: "Obuna bo'ldim", en: "I subscribed" },
  backToSite: { ru: "Вернуться на сайт", uz: "Saytga qaytish", en: "Back to the site" },
  confirmBtn: { ru: "Подтвердить участие", uz: "Qatnashishni tasdiqlash", en: "Confirm our place" },
  fewerBtn: { ru: "Нас меньше {min}", uz: "Bizdan {min} kishidan kam", en: "We're fewer than {min}" },
};
const tx = (key: string, lang: Lang, v?: Vars) => fill(TEXT[key][lang], v);

type Button = { text: string; url?: string; callback_data?: string };
async function say(chatId: number, text: string, buttons?: Button[][]) {
  return await tg("sendMessage", { chat_id: chatId, text, disable_web_page_preview: true, ...(buttons ? { reply_markup: { inline_keyboard: buttons } } : {}) });
}

const MONTHS: Record<Lang, string[]> = {
  ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
  uz: ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};
/** "2026-12-06T10:00" -> "6 декабря, 10:00" (event times are stored as local time) */
function when(local: string, lang: Lang): string {
  const [d, time = ""] = (local ?? "").split("T");
  const [, m, day] = d.split("-").map(Number);
  if (!m || !day) return local ?? "";
  const date = lang === "en" ? `${MONTHS.en[m - 1]} ${day}` : `${day} ${MONTHS[lang][m - 1]}`;
  return time ? `${date}, ${time.slice(0, 5)}` : date;
}

const teamLink = (code: string) => `https://t.me/${BOT}?start=t_${code}`;
const eventUrl = (hid: string) => `${SITE}#/app/hackathons/${hid}`;

/* ---------- connect Telegram to a site account ---------- */

type From = { id: number; username?: string; language_code?: string };

async function linkAccount(code: string, from: From, chatId: number) {
  const lang = pickLang(from.language_code);
  const { data: row } = await db.from("channel_codes").select("user_id").eq("code", code).maybeSingle();
  if (!row) return say(chatId, tx("expired", lang));
  const { data: other } = await db.from("tg_links").select("user_id").eq("tg_id", from.id).maybeSingle();
  if (other && other.user_id !== row.user_id) return say(chatId, tx("takenTg", lang));

  const username = from.username ? from.username.toLowerCase() : null;
  await db.from("tg_links").upsert({ user_id: row.user_id, tg_id: from.id, username, at: new Date().toISOString() });
  await db.from("channel_codes").delete().eq("code", code);

  // the subscription is not needed here, but remember it if it is there
  if ((await inChannel(from.id)) === true) await db.from("profiles").update({ channel_ok_at: new Date().toISOString() }).eq("id", row.user_id);

  // people listed in a team by this username now see it in their account
  let found: string[] = [];
  if (username) {
    const { data: rows } = await db
      .from("team_members")
      .update({ user_id: row.user_id, tg_id: from.id })
      .eq("username", username)
      .is("declined_at", null)
      .select("team_id");
    if (rows?.length) {
      const { data: teams } = await db.from("teams").select("data").in("id", rows.map((r) => r.team_id));
      found = (teams ?? []).map((t) => `«${t.data.teamName}»`);
    }
  }
  const lines = [tx("linked", lang)];
  if (found.length) lines.push(tx("linkedTeams", lang, { teams: found.join(", ") }));
  if (!username) lines.push(tx("noUsername", lang));
  return say(chatId, lines.join("\n\n"), [[{ text: tx("backToSite", lang), url: `${SITE}#/app/profile` }]]);
}

/* ---------- team confirmation ---------- */

// deno-lint-ignore no-explicit-any
type Team = { id: string; hackathon_id: string; lead_id: string; confirm_code: string; confirmed_at: string | null; merge_ok: boolean; data: any };
// deno-lint-ignore no-explicit-any
type Event = { id: string; data: any };

async function teamByCode(code: string): Promise<{ team: Team; event: Event } | null> {
  const { data: team } = await db.from("teams").select("id, hackathon_id, lead_id, confirm_code, confirmed_at, merge_ok, data").eq("confirm_code", code).maybeSingle();
  if (!team) return null;
  const { data: event } = await db.from("hackathons").select("id, data").eq("id", team.hackathon_id).maybeSingle();
  return event ? { team: team as Team, event: event as Event } : null;
}

function inviteText(team: Team, event: Event, lang: Lang) {
  const h = event.data;
  const where = h.mode === "online" ? "Online" : [h.venue, h.address && h.address !== h.city ? h.address : "", h.city].filter(Boolean).join(", ");
  // deno-lint-ignore no-explicit-any
  const agenda = (h.agenda ?? []).filter((a: any) => a.title).map((a: any) => `${a.time}  ${a.title}`).join("\n");
  return [
    tx("invite", lang, { title: h.title, team: team.data.teamName, when: when(h.start, lang), where, agenda: agenda ? tx("agenda", lang) + agenda : "", url: eventUrl(event.id) }),
    tx("account", lang, { url: `${SITE}#/register?type=talent` }),
  ].join("\n\n");
}

async function confirmMember(code: string, from: From, chatId: number) {
  const lang = pickLang(from.language_code);
  const found = await teamByCode(code);
  if (!found) return say(chatId, tx("expired", lang));
  const { team, event } = found;
  const username = from.username?.toLowerCase();

  // the lead by Telegram id, everyone else by username
  const { data: members } = await db.from("team_members").select("*").eq("team_id", team.id).is("declined_at", null);
  const me = (members ?? []).find((m) => m.tg_id === from.id) ?? (username ? (members ?? []).find((m) => m.username === username) : undefined);
  if (!me) {
    return say(chatId, username ? tx("notInTeam", lang, { u: username, team: team.data.teamName }) : tx("notInTeamNoUser", lang, { team: team.data.teamName }));
  }

  const sub = await inChannel(from.id);
  if (sub === null) return say(chatId, tx("broken", lang));
  if (!sub) {
    return say(chatId, tx("needChannel", lang), [[{ text: tx("openChannel", lang), url: CHANNEL_URL }], [{ text: tx("subscribed", lang), callback_data: `t:${code}` }]]);
  }

  const now = new Date().toISOString();
  await db.from("team_members").update({ confirmed_at: me.confirmed_at ?? now, tg_id: from.id }).eq("id", me.id);
  if (me.user_id) await db.from("profiles").update({ channel_ok_at: now }).eq("id", me.user_id);

  const min = Math.max(1, Number(event.data.teamMin) || 1);
  const { data: confirmed } = await db.from("team_members").select("id, tg_id").eq("team_id", team.id).is("declined_at", null).not("confirmed_at", "is", null);
  const n = confirmed?.length ?? 0;

  if (n < min) {
    return say(chatId, tx("confirmedWaiting", lang, { team: team.data.teamName, n, min, link: teamLink(code) }));
  }
  if (!team.confirmed_at) {
    // the team just reached its minimum: everyone who confirmed gets the invitation
    await db.from("teams").update({ confirmed_at: now }).eq("id", team.id);
    await db.rpc("notify", {
      target: team.lead_id, kind: "event", t_code: "n.teamConfirmedTitle", t_vars: { team: team.data.teamName },
      b_code: "n.teamConfirmedBody", b_vars: { title: event.data.title }, link: `#/app/hackathons/${event.id}`, body_text: null,
    });
    for (const m of confirmed ?? []) {
      if (m.tg_id && m.tg_id !== from.id) await say(m.tg_id, inviteText(team, event, "ru"));
    }
  }
  return say(chatId, inviteText(team, event, lang));
}

/** "We're fewer than N": first ask, and record the answer only after "yes" */
async function merge(step: "ask" | "yes" | "no", code: string, from: From, chatId: number) {
  const lang = pickLang(from.language_code);
  const found = await teamByCode(code);
  if (!found) return say(chatId, tx("expired", lang));
  const { data: lead } = await db.from("team_members").select("tg_id").eq("team_id", found.team.id).eq("is_lead", true).maybeSingle();
  if (!lead || lead.tg_id !== from.id) return say(chatId, tx("onlyLead", lang));
  const min = Math.max(1, Number(found.event.data.teamMin) || 1);
  if (step === "ask") {
    return say(chatId, tx("mergeAsk", lang, { min }), [[{ text: tx("yesMerge", lang), callback_data: `my:${code}` }], [{ text: tx("noMerge", lang), callback_data: `mn:${code}` }]]);
  }
  await db.from("teams").update({ merge_ok: step === "yes" }).eq("id", found.team.id);
  return say(chatId, step === "yes" ? tx("mergeOk", lang) : tx("mergeNo", lang, { min }));
}

/** admin: ask every team of an event to confirm; the bot writes to each lead */
async function requestConfirm(hid: string) {
  const { data: event } = await db.from("hackathons").select("id, data").eq("id", hid).maybeSingle();
  if (!event) return { error: "eventNotFound" };
  const { data: teams } = await db.from("teams").select("id, hackathon_id, lead_id, confirm_code, confirmed_at, merge_ok, data").eq("hackathon_id", hid);
  const sent: string[] = [];
  const failed: string[] = [];
  const now = new Date().toISOString();
  for (const team of (teams ?? []) as Team[]) {
    await db.from("teams").update({ confirm_requested_at: now }).eq("id", team.id);
    await db.rpc("notify", {
      target: team.lead_id, kind: "event", t_code: "n.confirmTitle", t_vars: { title: event.data.title },
      b_code: "n.confirmBody", b_vars: { team: team.data.teamName }, link: `#/app/hackathons/${hid}`, body_text: null,
    });
    if (team.confirmed_at) continue;
    const { data: link } = await db.from("tg_links").select("tg_id").eq("user_id", team.lead_id).maybeSingle();
    const min = Math.max(1, Number(event.data.teamMin) || 1);
    const lang: Lang = "ru";
    const r = link
      ? await say(
          link.tg_id,
          tx("askLead", lang, { title: event.data.title, when: when(event.data.start, lang), team: team.data.teamName, link: teamLink(team.confirm_code), min }),
          [[{ text: tx("confirmBtn", lang), url: teamLink(team.confirm_code) }], [{ text: tx("fewerBtn", lang, { min }), callback_data: `m:${team.confirm_code}` }]],
        )
      : { ok: false };
    (r.ok ? sent : failed).push(team.data.teamName);
  }
  return { sent: sent.length, failed };
}

/* ---------- entry ---------- */

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
      if (msg?.chat?.type === "private" && typeof msg.text === "string") {
        const arg = msg.text.startsWith("/start") ? (msg.text.split(/\s+/)[1] ?? "") : "";
        if (arg.startsWith("t_")) await confirmMember(arg.slice(2), msg.from, msg.chat.id);
        else if (arg) await linkAccount(arg, msg.from, msg.chat.id);
        else await say(msg.chat.id, tx("hello", pickLang(msg.from?.language_code)));
      }
      const cb = u.callback_query;
      if (cb?.data) {
        await tg("answerCallbackQuery", { callback_query_id: cb.id });
        const [kind, code] = String(cb.data).split(":");
        if (kind === "t") await confirmMember(code, cb.from, cb.message.chat.id);
        if (kind === "m") await merge("ask", code, cb.from, cb.message.chat.id);
        if (kind === "my") await merge("yes", code, cb.from, cb.message.chat.id);
        if (kind === "mn") await merge("no", code, cb.from, cb.message.chat.id);
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
    await db.from("profiles").update({ channel_ok_at: ok ? new Date().toISOString() : null }).eq("id", user.id);
    return json({ status: ok ? "member" : "not_member" });
  }

  const { data: p } = await db.from("profiles").select("kind").eq("id", user.id).maybeSingle();
  if (p?.kind !== "admin") return json({ error: "notAdmin" }, 403);

  if (body.action === "request_confirm" && typeof body.hid === "string") {
    return json(await requestConfirm(body.hid));
  }

  if (body.action === "setup") {
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
