import { supabase } from "./supabase";

/* Sign-in through Telegram or Google. Before leaving for the provider the site remembers
   where to come back to and, for a new account, what the person filled in on the sign-up
   screen (student or company, name, track, city, consent). The provider creates the account;
   when the person returns, finishSocialSignIn applies those choices and opens the next screen. */

export type SocialProvider = "telegram" | "google";

/** what the sign-up screen collected before the redirect */
export type PendingSignUp =
  | { type: "talent"; name: string; cat: string; city: string; consent: boolean }
  | { type: "company"; name: string; orgKind: "company" | "organization"; city: string; consent: boolean };

type Pending = { next: string; signUp: PendingSignUp | null; at: number };

const KEY = "lumora-after-sign-in";
const providerId: Record<SocialProvider, string> = { telegram: "custom:telegram", google: "google" };

function read(): Pending | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Pending;
    // a choice older than an hour is stale: the person gave up and came back another day
    return Date.now() - p.at < 3_600_000 ? p : null;
  } catch {
    return null;
  }
}

/** leave for Telegram or Google; the browser comes back to this site's address */
export async function startSocialSignIn(provider: SocialProvider, next: string, signUp: PendingSignUp | null): Promise<string | null> {
  try {
    localStorage.setItem(KEY, JSON.stringify({ next, signUp, at: Date.now() } satisfies Pending));
  } catch {
    /* private mode: the account still works, the sign-up choices are asked again in onboarding */
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: providerId[provider] as "google",
    options: { redirectTo: `${window.location.origin}${window.location.pathname}` },
  });
  return error ? error.message : null;
}

/** called once after the person comes back signed in */
export async function finishSocialSignIn(): Promise<void> {
  const p = read();
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  if (!p) return;
  const s = p.signUp;
  if (s) {
    await supabase.rpc("choose_kind", { new_kind: s.type, org_kind: s.type === "company" ? s.orgKind : "company", consent: s.consent });
    const patch: Record<string, unknown> = { city: s.city };
    if (s.name.trim()) patch.name = s.name.trim();
    if (s.type === "talent") Object.assign(patch, { cat: s.cat, region: s.city });
    await supabase.rpc("update_me", { patch });
  }
  window.location.hash = s ? "#/onboarding" : p.next;
}
