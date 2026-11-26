import { getDb, getSessionId, inRecovery, reload, type RawNotification } from "./db";
import { supabase } from "./supabase";
import { t } from "../i18n";
import type {
  AdminLevel,
  AdminProfile,
  Application,
  ApplicationStatus,
  AuditEntry,
  CompanyProfile,
  CompanyStatus,
  Hackathon,
  HackathonInput,
  Match,
  Message,
  Notification,
  Opportunity,
  OpportunityInput,
  OutboxMail,
  RegisterInput,
  Result,
  TalentProfile,
  TeamInput,
  TeamRegistration,
  User,
  Verification,
  VerificationProof,
  TeamMember,
  TeamMemberInput,
  TelegramLink,
} from "./types";

/* Lumora Connect API on Supabase. The screens call the same functions they called on the
   old browser mock. Reading comes from the in-memory copy in ./db (what this visitor may see,
   kept fresh by Realtime). Every change is a database function (supabase/migrations), which
   checks permissions on the server; the checks repeated here only give quicker messages.
   Error codes from the database are shown in the visitor's language ("api" dictionary). */

export class ApiError extends Error {}

const now = () => new Date().toISOString();
const norm = (s: string) => s.trim().toLowerCase();
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const fail = (code: string, vars?: Record<string, string | number>): never => {
  throw new ApiError(t(`api.${code}`, vars));
};

/** turn a database or sign-in error into a message in the interface language */
function apiError(message: string): ApiError {
  const m = message.trim();
  // database errors are codes, optionally with one value: "usernameTaken|alice"
  const known = (msg: string) => {
    const [code, arg] = msg.split("|");
    const k = `api.${code}`;
    const s = t(k, { v: arg ?? "" });
    return s === k ? null : s;
  };
  if (/invalid login credentials/i.test(m)) return new ApiError(t("api.wrongLogin"));
  if (/already registered|already been registered|already exists/i.test(m)) return new ApiError(t("api.emailTaken"));
  if (/rate limit|too many/i.test(m)) return new ApiError(t("api.rateLimit"));
  if (/password should be at least/i.test(m)) return new ApiError(t("api.shortPassword"));
  if (/email not confirmed/i.test(m)) return new ApiError(t("api.emailNotConfirmed"));
  return new ApiError(known(m) ?? t("api.serverError"));
}

/** call a database function, then refresh what this visitor sees */
async function rpc<T = unknown>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw apiError(error.message);
  await reload();
  return data as T;
}

export const matchId = (talentId: string, companyId: string) => `${talentId}__${companyId}`;

/** "2026-11-19T14:05" in the visitor's local time, comparable with event date-time fields */
export function localNow(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/* ---------- session helpers (sync, for rendering) ---------- */

export function currentUser(): User | null {
  const id = getSessionId();
  if (!id) return null;
  return getDb().users.find((u) => u.id === id) ?? null;
}

export function findUser(id: string): User | undefined {
  return getDb().users.find((u) => u.id === id);
}

export function unreadCount(userId: string): number {
  return getDb().notifications.filter((n) => n.userId === userId && !n.read).length;
}

function me(): User {
  return currentUser() ?? fail("signInFirst");
}
function meTalent(): TalentProfile {
  const u = me();
  return u.kind === "talent" ? u : fail("talentOnly");
}
function meCompany(): CompanyProfile {
  const u = me();
  return u.kind === "company" ? u : fail("companyOnly");
}
function meApprovedCompany(): CompanyProfile {
  const c = meCompany();
  if (c.status !== "approved") fail("companyPending");
  return c;
}
function meAdmin(level?: AdminLevel): AdminProfile {
  const u = me();
  if (u.kind !== "admin") fail("adminOnly");
  const a = u as AdminProfile;
  if (level === "super" && a.level !== "super") fail("superOnly");
  return a;
}

/** the site's own address, where sign-in emails send people back */
const siteUrl = () => `${window.location.origin}${window.location.pathname}`;

/* ---------- profile completeness and verification ---------- */

export type CheckItem = { key: string; done: boolean; required: boolean };
export type Completeness = { items: CheckItem[]; done: number; total: number; percent: number; ready: boolean };

/** What a profile still needs. "ready" means every required item is filled, so verification can be requested. */
export function completeness(u: TalentProfile | CompanyProfile): Completeness {
  const items: CheckItem[] =
    u.kind === "talent"
      ? [
          { key: "photo", done: !!u.photo, required: false },
          { key: "headline", done: u.headline.trim().length >= 4, required: true },
          { key: "bio", done: u.bio.trim().length >= 40, required: true },
          { key: "education", done: !!u.education.institution.trim(), required: true },
          { key: "skills", done: u.skills.length >= 3, required: true },
          { key: "languages", done: u.languages.length >= 1, required: true },
          { key: "projects", done: u.projects.length >= 1, required: true },
          { key: "roles", done: u.roles.length >= 1 && u.workFormats.length >= 1, required: true },
          { key: "links", done: !!(u.github.trim() || u.portfolio.trim()), required: true },
          { key: "contact", done: !!u.contact.trim(), required: true },
          { key: "cv", done: !!u.cv, required: false },
          { key: "experience", done: u.experience.length >= 1, required: false },
        ]
      : [
          { key: "logo", done: !!u.logo, required: false },
          { key: "tagline", done: u.tagline.trim().length >= 6, required: true },
          { key: "about", done: u.about.trim().length >= 60, required: true },
          { key: "industry", done: !!u.industry.trim() && !!u.size.trim(), required: true },
          { key: "website", done: !!u.website.trim(), required: true },
          { key: "contact", done: !!u.contact.trim(), required: true },
          { key: "benefits", done: u.benefits.length >= 1, required: false },
          { key: "founded", done: !!u.foundedYear.trim(), required: false },
        ];
  const done = items.filter((i) => i.done).length;
  return {
    items,
    done,
    total: items.length,
    percent: Math.round((done / items.length) * 100),
    ready: items.every((i) => !i.required || i.done),
  };
}

/* ---------- auth ---------- */

/** wait until the signed-in account's profile is in memory */
async function afterSignIn(): Promise<User> {
  await reload();
  for (let i = 0; i < 10 && !currentUser(); i++) {
    await new Promise((r) => setTimeout(r, 300));
    await reload();
  }
  return currentUser() ?? fail("accountRemoved");
}

const auth = {
  async login(email: string, password: string): Promise<User> {
    const { error } = await supabase.auth.signInWithPassword({ email: norm(email), password });
    if (error) throw apiError(error.message);
    return afterSignIn();
  },

  async register(input: RegisterInput): Promise<User> {
    const email = norm(input.email);
    if (!EMAIL.test(email)) fail("badEmail");
    if (input.password.length < 8) fail("shortPassword");
    if (!input.name.trim()) fail(input.type === "talent" ? "noName" : "noOrgName");
    if (!input.city.trim()) fail("noCity");
    if (!input.consent) fail("noConsent");
    const meta =
      input.type === "talent"
        ? { type: "talent", name: input.name.trim(), cat: input.cat, city: input.city.trim(), consent: true }
        : { type: "company", name: input.name.trim(), orgKind: input.orgKind, city: input.city.trim(), consent: true };
    const { data, error } = await supabase.auth.signUp({ email, password: input.password, options: { data: meta, emailRedirectTo: siteUrl() } });
    if (error) throw apiError(error.message);
    // with email confirmation switched on there is no session yet: the person confirms first
    if (!data.session) fail("checkEmail");
    return afterSignIn();
  },

  async logout() {
    await supabase.auth.signOut();
    await reload();
  },

  /** always answers the same way, so nobody can probe which emails have accounts */
  async requestReset(email: string): Promise<void> {
    if (!EMAIL.test(norm(email))) fail("badEmail");
    await supabase.auth.resetPasswordForEmail(norm(email), { redirectTo: siteUrl() });
  },

  /** the reset screen opens from the email link; Supabase signs the person in for the change */
  async checkToken(_token: string, kind: "reset" | "confirm"): Promise<boolean> {
    if (kind === "confirm") return true;
    const { data } = await supabase.auth.getSession();
    return inRecovery() || !!data.session;
  },

  async resetPassword(_token: string, password: string): Promise<void> {
    if (password.length < 8) fail("shortPassword");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw apiError(error.message);
  },

  /** the confirmation link itself confirms the address; this only refreshes the profile */
  async confirmEmail(_token: string): Promise<void> {
    await reload();
  },

  async resendConfirm(): Promise<void> {
    const u = me();
    if (u.kind === "admin" || u.emailConfirmed) return;
    const { error } = await supabase.auth.resend({ type: "signup", email: u.email, options: { emailRedirectTo: siteUrl() } });
    if (error) throw apiError(error.message);
  },

  async changePassword(oldPassword: string, password: string): Promise<void> {
    const u = me();
    if (password.length < 8) fail("shortPassword");
    const check = await supabase.auth.signInWithPassword({ email: u.email, password: oldPassword });
    if (check.error) fail("wrongPassword");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw apiError(error.message);
  },

  /** real emails now go to the real mailbox; the preview mailbox stays empty */
  async outbox(_email?: string): Promise<OutboxMail[]> {
    return [];
  },

  async resetDemo() {
    await auth.logout();
  },
};

/* ---------- profiles ---------- */

type TalentPatch = Partial<Omit<TalentProfile, "kind" | "id" | "email" | "verified" | "badges" | "createdAt" | "verification" | "emailConfirmed" | "consentAt" | "demo">>;
type CompanyPatch = Partial<Omit<CompanyProfile, "kind" | "id" | "email" | "status" | "statusNote" | "verified" | "partner" | "createdAt" | "verification" | "emailConfirmed" | "consentAt" | "demo">>;

const MAX_FILE = 2_000_000; // characters of data URL, about 1.5 MB of file

const users = {
  async get(id: string): Promise<User | undefined> {
    return findUser(id);
  },

  /** talent page, for signed-in companies, admins and the talent themself */
  async talent(id: string): Promise<TalentProfile> {
    me();
    const u = findUser(id);
    return u?.kind === "talent" ? u : fail("notFound");
  },

  async updateMe(patch: TalentPatch | CompanyPatch | { name?: string }): Promise<User> {
    const u = me();
    if ("name" in patch && patch.name !== undefined && !patch.name.trim()) fail("emptyName");
    for (const v of Object.values(patch)) {
      if (typeof v === "string" && v.startsWith("data:") && v.length > MAX_FILE) fail("fileTooBig");
      if (v && typeof v === "object" && "dataUrl" in v && String((v as { dataUrl: string }).dataUrl).length > MAX_FILE) fail("fileTooBig");
    }
    await rpc("update_me", { patch });
    return findUser(u.id)!;
  },

  async finishOnboarding(): Promise<void> {
    me();
    await rpc("finish_onboarding");
  },

  /**
   * Ask for the verified mark. The profile must be complete. A Lumora result is checked
   * automatically; other proofs go to the admin queue.
   */
  async requestVerification(proof: VerificationProof, proofValue = ""): Promise<Verification> {
    const u = me();
    if (u.kind === "admin") fail("adminOnly");
    const p = u as TalentProfile | CompanyProfile;
    if (p.verification.level === "verified") return p.verification;
    if (!completeness(p).ready) fail("profileIncomplete");
    if (proof === "university_email" && !/^[^\s@]+@[^\s@]+\.(uz|edu|ac\.[a-z]+|edu\.[a-z]+)$/i.test(proofValue.trim())) fail("badUniEmail");
    if (proof === "github" && !/github\.com\/[\w-]+/i.test(proofValue)) fail("badGithub");
    if (proof === "company_email") {
      const domain = proofValue.split("@")[1]?.toLowerCase() ?? "";
      const site = (p as CompanyProfile).website?.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] ?? "";
      if (!EMAIL.test(proofValue) || !site || !domain.endsWith(site)) fail("badCompanyEmail");
    }
    return rpc<Verification>("request_verification", { proof, proof_value: proofValue });
  },

  async talents(q = "", cat = ""): Promise<TalentProfile[]> {
    const s = norm(q);
    return getDb()
      .users.filter((u): u is TalentProfile => u.kind === "talent")
      .filter((x) => (!cat || x.cat === cat) && (!s || norm(`${x.name} ${x.city} ${x.headline} ${x.skills.join(" ")}`).includes(s)));
  },

  async companies(): Promise<CompanyProfile[]> {
    return getDb().users.filter((u): u is CompanyProfile => u.kind === "company" && u.status === "approved");
  },

  /** public company page: profile plus its open postings */
  async company(id: string): Promise<{ company: CompanyProfile; openings: Opportunity[] }> {
    const c = findUser(id);
    if (!c || c.kind !== "company" || (c.status !== "approved" && currentUser()?.id !== id && currentUser()?.kind !== "admin")) fail("notFound");
    const company = c as CompanyProfile;
    return {
      company,
      openings: getDb()
        .opportunities.filter((o) => o.companyId === id && !o.hidden && !o.closed)
        .sort((a, b) => b.postedAt.localeCompare(a.postedAt)),
    };
  },

  /** winners strip: talents with at least one ranked badge */
  async winners(limit = 8): Promise<TalentProfile[]> {
    return getDb()
      .users.filter((u): u is TalentProfile => u.kind === "talent" && (u.badges?.length ?? 0) > 0)
      .sort((a, b) => (b.badges.at(-1)?.awardedAt ?? "").localeCompare(a.badges.at(-1)?.awardedAt ?? ""))
      .slice(0, limit);
  },

  async stats() {
    return statsNow();
  },
};

/** sync stats, so counters can render on the first frame (admins see everything; others see what they may) */
export function statsNow() {
  const d = getDb();
  const open = d.opportunities.filter((o) => !o.hidden && !o.closed);
  const byCat: Record<string, number> = {};
  for (const o of open) for (const c of o.cats ?? []) byCat[c] = (byCat[c] ?? 0) + 1;
  return {
    talents: d.users.filter((u) => u.kind === "talent").length,
    verifiedTalents: d.users.filter((u) => u.kind === "talent" && u.verified).length,
    companies: d.users.filter((u) => u.kind === "company" && u.status === "approved").length,
    pendingCompanies: d.users.filter((u) => u.kind === "company" && u.status === "pending").length,
    pendingVerifications: d.users.filter((u) => u.kind !== "admin" && u.verification?.level === "pending").length,
    openOpportunities: open.length,
    hiddenOpportunities: d.opportunities.filter((o) => o.hidden).length,
    opportunitiesByCat: byCat,
    events: d.hackathons.filter((h) => h.status !== "draft").length,
    cities: new Set(d.hackathons.filter((h) => h.mode !== "online").map((h) => h.city)).size,
    teams: Object.values(d.teamCounts).reduce((a, b) => a + b, 0),
  };
}

/* ---------- swiping, matches, chat ---------- */

function matchesFor(userId: string): Match[] {
  const d = getDb();
  const liked = (a: string, b: string) => d.swipes.find((s) => s.fromId === a && s.toId === b && s.dir === 1);
  const out: Match[] = [];
  for (const s of d.swipes) {
    if (s.dir !== 1 || s.fromId !== userId) continue;
    const back = liked(s.toId, userId);
    if (!back) continue;
    const u = findUser(userId);
    const talentId = u?.kind === "talent" ? userId : s.toId;
    const companyId = u?.kind === "talent" ? s.toId : userId;
    out.push({ id: matchId(talentId, companyId), talentId, companyId, at: s.at > back.at ? s.at : back.at });
  }
  return out.sort((a, b) => b.at.localeCompare(a.at));
}

const swipe = {
  async deck(): Promise<(TalentProfile | CompanyProfile)[]> {
    const u = me();
    const d = getDb();
    const seen = new Set(d.swipes.filter((s) => s.fromId === u.id).map((s) => s.toId));
    if (u.kind === "talent") {
      return d.users.filter((x): x is CompanyProfile => x.kind === "company" && x.status === "approved" && !seen.has(x.id));
    }
    if (u.kind === "company") {
      return d.users.filter((x): x is TalentProfile => x.kind === "talent" && x.onboarded && !seen.has(x.id));
    }
    return fail("adminsNoSwipe");
  },

  async swipe(toId: string, dir: 1 | -1): Promise<{ match: Match | null }> {
    const u = me();
    if (u.kind === "admin") fail("adminsNoSwipe");
    if (u.kind === "company") meApprovedCompany();
    const isMatch = await rpc<boolean>("do_swipe", { target: toId, dir });
    if (!isMatch) return { match: null };
    const talentId = u.kind === "talent" ? u.id : toId;
    const companyId = u.kind === "talent" ? toId : u.id;
    return { match: { id: matchId(talentId, companyId), talentId, companyId, at: now() } };
  },

  /** clear my own swipes that did not end in a match */
  async resetDeck() {
    me();
    await rpc("reset_deck");
  },

  async liked(): Promise<User[]> {
    const u = me();
    return getDb()
      .swipes.filter((s) => s.fromId === u.id && s.dir === 1)
      .map((s) => findUser(s.toId))
      .filter((x): x is User => !!x);
  },

  async matches(): Promise<(Match & { other: User; last: Message | null })[]> {
    const u = me();
    const d = getDb();
    return matchesFor(u.id)
      .map((m) => {
        const otherId = u.kind === "talent" ? m.companyId : m.talentId;
        const msgs = d.messages.filter((x) => x.matchId === m.id);
        return { ...m, other: findUser(otherId)!, last: msgs.at(-1) ?? null };
      })
      .filter((m) => m.other);
  },

  async messages(id: string): Promise<Message[]> {
    const u = me();
    if (!matchesFor(u.id).some((m) => m.id === id)) fail("noConversation");
    return getDb().messages.filter((m) => m.matchId === id);
  },

  async send(id: string, text: string): Promise<Message> {
    const u = me();
    if (!matchesFor(u.id).some((x) => x.id === id)) fail("noConversation");
    if (!text.trim()) fail("emptyMessage");
    const mid = await rpc<string>("send_message", { mid: id, body: text });
    return getDb().messages.find((m) => m.id === mid) ?? { id: mid, matchId: id, fromId: u.id, text: text.trim(), at: now() };
  },
};

/* ---------- opportunities and applications ---------- */

export type OpportunityWithCompany = Opportunity & { company: CompanyProfile };
export type OpportunityDetail = OpportunityWithCompany & { applicants: number; myApplication: Application | null };
export type ApplicationWithTalent = Application & { talent: TalentProfile; opportunity: Opportunity };
export type ApplicationWithOpportunity = Application & { opportunity: OpportunityWithCompany };
export type ApplyInput = { cover: string; answers: string[]; withCv: boolean };

function withCompany(o: Opportunity): OpportunityWithCompany {
  return { ...o, company: findUser(o.companyId) as CompanyProfile };
}
const visible = (o: Opportunity) => !o.hidden && (findUser(o.companyId) as CompanyProfile | undefined)?.status === "approved";

const opportunities = {
  /** public list: visible postings from approved companies, open first */
  async list(): Promise<OpportunityWithCompany[]> {
    return listNow();
  },

  async get(id: string): Promise<OpportunityDetail> {
    const d = getDb();
    const o = d.opportunities.find((x) => x.id === id);
    const u = currentUser();
    const own = u?.kind === "company" && o?.companyId === u.id;
    if (!o || !findUser(o.companyId) || (!visible(o) && !own && u?.kind !== "admin")) fail("notFound");
    return {
      ...withCompany(o!),
      applicants: d.appCounts[id] ?? 0,
      myApplication: u?.kind === "talent" ? (d.applications.find((a) => a.opportunityId === id && a.talentId === u.id) ?? null) : null,
    };
  },

  /** company dashboard: my postings including hidden ones */
  async mine(): Promise<OpportunityWithCompany[]> {
    const c = meCompany();
    return getDb()
      .opportunities.filter((o) => o.companyId === c.id)
      .sort((a, b) => b.postedAt.localeCompare(a.postedAt))
      .map(withCompany);
  },

  async create(input: OpportunityInput): Promise<Opportunity> {
    meApprovedCompany();
    validateOpportunity(input);
    const id = await rpc<string>("opp_create", { input });
    return getDb().opportunities.find((o) => o.id === id)!;
  },

  async update(id: string, patch: Partial<OpportunityInput>): Promise<void> {
    const c = meCompany();
    const o = getDb().opportunities.find((x) => x.id === id) ?? fail("postingNotFound");
    if (o.companyId !== c.id) fail("notYourPosting");
    validateOpportunity({ ...o, ...patch });
    await rpc("opp_update", { oid: id, patch });
  },

  async remove(id: string): Promise<void> {
    meCompany();
    await rpc("opp_remove", { oid: id });
  },

  async apply(opportunityId: string, input: ApplyInput = { cover: "", answers: [], withCv: false }): Promise<Application> {
    const tal = meTalent();
    const d0 = getDb();
    const o = d0.opportunities.find((x) => x.id === opportunityId && !x.hidden) ?? fail("postingGone");
    if (o.closed || (o.deadline && o.deadline < localNow().slice(0, 10))) fail("postingClosed");
    if (d0.applications.some((a) => a.opportunityId === opportunityId && a.talentId === tal.id)) fail("alreadyApplied");
    if (o.questions.some((_, i) => !input.answers[i]?.trim())) fail("answerAll");
    if (input.withCv && !tal.cv) fail("noCv");
    const id = await rpc<string>("opp_apply", { oid: opportunityId, input: { ...input, answers: input.answers.map((a) => a.trim()) } });
    return getDb().applications.find((a) => a.id === id)!;
  },

  async withdraw(applicationId: string): Promise<void> {
    meTalent();
    await rpc("opp_withdraw", { aid: applicationId });
  },

  async myApplications(): Promise<ApplicationWithOpportunity[]> {
    const tal = meTalent();
    const d = getDb();
    return d.applications
      .filter((a) => a.talentId === tal.id)
      .map((a) => {
        const o = d.opportunities.find((x) => x.id === a.opportunityId);
        return o ? { ...a, opportunity: withCompany(o) } : null;
      })
      .filter((a): a is ApplicationWithOpportunity => !!a && !!a.opportunity.company)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async applicants(): Promise<ApplicationWithTalent[]> {
    const c = meCompany();
    const d = getDb();
    const mine = new Set(d.opportunities.filter((o) => o.companyId === c.id).map((o) => o.id));
    return d.applications
      .filter((a) => mine.has(a.opportunityId))
      .map((a) => ({
        ...a,
        talent: findUser(a.talentId) as TalentProfile,
        opportunity: d.opportunities.find((o) => o.id === a.opportunityId)!,
      }))
      .filter((a) => a.talent)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async setStatus(applicationId: string, status: ApplicationStatus, note = ""): Promise<void> {
    meCompany();
    await rpc("app_set_status", { aid: applicationId, new_status: status, note });
  },
};

/** sync list for first paint */
export function listNow(): OpportunityWithCompany[] {
  const today = localNow().slice(0, 10);
  const open = (o: Opportunity) => !o.closed && (!o.deadline || o.deadline >= today);
  return getDb()
    .opportunities.filter(visible)
    .sort((a, b) => Number(open(b)) - Number(open(a)) || b.postedAt.localeCompare(a.postedAt))
    .map(withCompany);
}

function validateOpportunity(o: OpportunityInput) {
  if (!o.title.trim()) fail("noTitle");
  if (!o.cats.length) fail("noTrack");
  if (o.salaryMin != null && o.salaryMax != null && o.salaryMax < o.salaryMin) fail("salaryReversed");
  if (o.openings < 1) fail("noOpenings");
}

/* ---------- hackathons ---------- */

export type TeamWithLead = TeamRegistration & { lead: TalentProfile | undefined; people: TeamMember[] };

const PUBLIC_STATUSES: Hackathon["status"][] = ["published", "registration_open", "registration_closed", "in_progress", "finished", "cancelled"];

const hackathons = {
  /** everyone sees non-draft events; admins also see drafts */
  async list(opts: { includeDrafts?: boolean } = {}): Promise<Hackathon[]> {
    const u = currentUser();
    const showDrafts = opts.includeDrafts && u?.kind === "admin";
    return getDb()
      .hackathons.filter((h) => showDrafts || PUBLIC_STATUSES.includes(h.status))
      .sort((a, b) => a.start.localeCompare(b.start));
  },

  async get(id: string): Promise<Hackathon | undefined> {
    return getDb().hackathons.find((h) => h.id === id);
  },

  async create(input: HackathonInput): Promise<Hackathon> {
    meAdmin();
    validateEvent(input);
    const id = await rpc<string>("ev_create", { input });
    return getDb().hackathons.find((h) => h.id === id)!;
  },

  async update(id: string, patch: Partial<HackathonInput>): Promise<Hackathon> {
    meAdmin();
    const before = getDb().hackathons.find((h) => h.id === id) ?? fail("eventNotFound");
    validateEvent({ ...before, ...patch });
    await rpc("ev_update", { hid: id, patch });
    return getDb().hackathons.find((h) => h.id === id)!;
  },

  async remove(id: string): Promise<void> {
    meAdmin("super");
    await rpc("ev_remove", { hid: id });
  },

  /** one-time code for the Lumora bot, which confirms the Telegram channel subscription */
  async channelCode(): Promise<string> {
    meTalent();
    const { data, error } = await supabase.rpc("channel_code");
    if (error) throw new ApiError(t("api.serverError"));
    return data as string;
  },

  /** ask the bot to check again with the Telegram account that confirmed before */
  async recheckChannel(): Promise<"member" | "not_member" | "no_link" | "broken"> {
    meTalent();
    const { data, error } = await supabase.functions.invoke("tg-bot", { body: { action: "recheck" } });
    await reload();
    if (error) return "broken";
    return (data as { status: "member" | "not_member" | "no_link" | "broken" }).status;
  },

  async registerTeam(hackathonId: string, input: TeamInput): Promise<TeamRegistration> {
    const tal = meTalent();
    const d0 = getDb();
    const h = d0.hackathons.find((x) => x.id === hackathonId) ?? fail("eventNotFound");
    if (h.status !== "registration_open") fail("regNotOpen");
    if (!getDb().tgLinks.some((l) => l.userId === tal.id)) fail("telegramRequired");
    const nowLocal = localNow();
    if (h.regOpen && nowLocal < h.regOpen) fail("regOpensOn", { date: h.regOpen.replace("T", " ") });
    if (h.regClose && nowLocal > h.regClose) fail("regClosed");
    if (d0.teams.some((x) => x.hackathonId === hackathonId && x.leadId === tal.id)) fail("alreadyRegistered");
    if (h.maxTeams && (d0.teamCounts[hackathonId] ?? 0) >= h.maxTeams) fail("eventFull");
    if (!input.teamName.trim()) fail("noTeamName");
    if (!input.consent) fail("noConsent");
    const listed = input.members.filter((m) => m.name.trim() || m.username.trim());
    for (const m of listed) {
      const u = normUsername(m.username);
      if (u && !/^[a-z][a-z0-9_]{3,31}$/.test(u)) fail("badUsername", { v: u });
    }
    const size = listed.length + 1;
    if (size === 1 && !h.soloAllowed && h.teamMin > 1) fail("noSolo", { n: h.teamMin });
    if (size > 1 && size < h.teamMin) fail("teamMin", { n: h.teamMin });
    if (size > h.teamMax) fail("teamMax", { n: h.teamMax });
    if (input.track && !h.tracks.includes(input.track)) fail("badTrack");
    if (h.registrationFields.github && !input.github.trim()) fail("needGithub");
    if (h.registrationFields.portfolio && !input.portfolio.trim()) fail("needPortfolio");
    if (h.registrationFields.motivation && !input.motivation.trim()) fail("needMotivation");
    if (h.registrationFields.phone && !input.phone.trim()) fail("needPhone");
    const id = await rpc<string>("team_register", { hid: hackathonId, input });
    return getDb().teams.find((x) => x.id === id)!;
  },

  /** people in a team, the lead first */
  async members(teamId: string): Promise<TeamMember[]> {
    return getDb().teamMembers.filter((m) => m.teamId === teamId);
  },

  /** the lead fixes the list; people who already confirmed stay */
  async setMembers(teamId: string, members: TeamMemberInput[]): Promise<void> {
    meTalent();
    for (const m of members) {
      const u = normUsername(m.username);
      if (u && !/^[a-z][a-z0-9_]{3,31}$/.test(u)) fail("badUsername", { v: u });
    }
    await rpc("team_set_members", { tid: teamId, members });
  },

  /** "this is not me": the signed-in person was listed in a team by mistake */
  async declineMember(memberId: string): Promise<void> {
    await rpc("team_member_decline", { mid: memberId });
  },

  /** a small team agrees that the organizers merge it with another one */
  async setMergeOk(teamId: string, ok: boolean): Promise<void> {
    await rpc("team_merge_ok", { tid: teamId, ok });
  },

  /** admin: the bot asks every team of the event to confirm */
  async requestConfirm(hackathonId: string): Promise<{ sent: number; failed: string[] }> {
    meAdmin();
    const { data, error } = await supabase.functions.invoke("tg-bot", { body: { action: "request_confirm", hid: hackathonId } });
    await reload();
    if (error || !data || (data as { error?: string }).error) throw new ApiError(t("api.botUnavailable"));
    return data as { sent: number; failed: string[] };
  },

  async cancelMyTeam(hackathonId: string): Promise<void> {
    meTalent();
    await rpc("team_cancel", { hid: hackathonId });
  },

  /** teams the person leads or is listed in */
  async myTeams(): Promise<TeamRegistration[]> {
    const u = currentUser();
    if (!u || u.kind !== "talent") return [];
    const listed = new Set(myMemberRows(u.id).map((m) => m.teamId));
    return getDb().teams.filter((x) => x.leadId === u.id || listed.has(x.id));
  },

  async teams(hackathonId: string): Promise<TeamWithLead[]> {
    meAdmin();
    return getDb()
      .teams.filter((x) => x.hackathonId === hackathonId)
      .map((x) => ({ ...x, lead: findUser(x.leadId) as TalentProfile | undefined, people: getDb().teamMembers.filter((m) => m.teamId === x.id && !m.declinedAt) }));
  },

  async teamCounts(): Promise<Record<string, number>> {
    return { ...getDb().teamCounts };
  },

  /** assign results and award badges to the team leads */
  async setResults(hackathonId: string, results: Result[]): Promise<void> {
    meAdmin();
    await rpc("ev_set_results", { hid: hackathonId, results });
  },
};

export function statusLabel(s: Hackathon["status"]): string {
  return t(`api.status_${s}`);
}

function validateEvent(h: HackathonInput) {
  if (!h.title.trim()) fail("evTitle");
  if (!h.start || !h.end) fail("evDates");
  if (h.end < h.start) fail("evEndsBefore");
  if (h.regOpen && h.regClose && h.regClose < h.regOpen) fail("evRegReversed");
  if (h.teamMin < 1 || h.teamMax < h.teamMin) fail("evTeamSize");
  if (h.ageMin && h.ageMax && h.ageMax < h.ageMin) fail("evAge");
  if (!h.tracks.length) fail("evTracks");
  if (!h.places.length) fail("evPlaces");
  if (h.places.length > 20) fail("evPlacesMax");
}

/* ---------- notifications ---------- */

/** notification texts are stored as codes; show them in the interface language */
function render(n: RawNotification): Notification {
  const [tc, tv] = n.raw.t ?? ["", {}];
  const vars: Record<string, string> = { ...(tv ?? {}) };
  if (tc === "n.eventStatusTitle" && vars.status) vars.status = statusLabel(vars.status as Hackathon["status"]);
  const title = tc ? t(`api.${tc}`, vars) : "";
  let body = n.raw.text ?? "";
  if (n.raw.b) {
    const [bc, bv] = n.raw.b;
    body = t(`api.${bc}`, bv ?? {});
    if (bc.startsWith("n.status_") && bv?.note) body += ` ${t("api.n.note", { note: bv.note })}`;
  }
  const { raw: _raw, ...rest } = n;
  return { ...rest, title, body };
}

const notifications = {
  async list(): Promise<Notification[]> {
    const u = me();
    return (getDb().notifications as RawNotification[]).filter((n) => n.userId === u.id).map(render);
  },
  async markRead(id: string) {
    await rpc("notif_read", { nid: id });
  },
  async markAllRead() {
    me();
    await rpc("notif_read_all");
  },
};

/* ---------- admin ---------- */

export type UserFilter = { role?: "talent" | "company" | "admin" | ""; status?: CompanyStatus | "verified" | "unverified" | ""; q?: string };

const admin = {
  async users(f: UserFilter = {}): Promise<User[]> {
    meAdmin();
    const s = norm(f.q ?? "");
    return getDb()
      .users.filter((u) => !f.role || u.kind === f.role)
      .filter((u) => {
        if (!f.status) return true;
        if (f.status === "verified") return u.kind !== "admin" && u.verified;
        if (f.status === "unverified") return u.kind !== "admin" && !u.verified;
        return u.kind === "company" && u.status === f.status;
      })
      .filter((u) => !s || norm(`${u.name} ${u.email}`).includes(s))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async companyQueue(): Promise<CompanyProfile[]> {
    meAdmin();
    return getDb()
      .users.filter((u): u is CompanyProfile => u.kind === "company" && u.status === "pending")
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  async setCompanyStatus(companyId: string, status: Exclude<CompanyStatus, "pending">, note = ""): Promise<void> {
    meAdmin();
    if (status === "rejected" && !note.trim()) fail("needReason");
    await rpc("adm_company_status", { cid: companyId, new_status: status, note });
  },

  /** people and companies who asked for the verified mark */
  async verificationQueue(): Promise<(TalentProfile | CompanyProfile)[]> {
    meAdmin();
    return getDb()
      .users.filter((u): u is TalentProfile | CompanyProfile => u.kind !== "admin" && u.verification?.level === "pending")
      .sort((a, b) => a.verification.requestedAt.localeCompare(b.verification.requestedAt));
  },

  async reviewVerification(userId: string, approve: boolean, note = ""): Promise<void> {
    meAdmin();
    if (!approve && !note.trim()) fail("needReason");
    await rpc("adm_review_verification", { uid: userId, approve, note });
  },

  async setVerified(userId: string, verified: boolean): Promise<void> {
    meAdmin();
    await rpc("adm_set_verified", { uid: userId, verified });
  },

  async awardBadge(talentId: string, b: { hackathonId: string; place: number | null; title: string; teamName?: string }): Promise<void> {
    meAdmin();
    if (!b.title.trim()) fail("badgeTitle");
    await rpc("adm_award_badge", { tid: talentId, hid: b.hackathonId, place: b.place, title: b.title, team_name: b.teamName ?? null });
  },

  async revokeBadge(talentId: string, badgeId: string): Promise<void> {
    meAdmin("super");
    await rpc("adm_revoke_badge", { tid: talentId, bid: badgeId });
  },

  async opportunities(): Promise<OpportunityWithCompany[]> {
    meAdmin();
    return getDb()
      .opportunities.slice()
      .sort((a, b) => Number(b.hidden) - Number(a.hidden) || b.postedAt.localeCompare(a.postedAt))
      .map(withCompany);
  },

  async setOpportunityHidden(id: string, hidden: boolean, reason = ""): Promise<void> {
    meAdmin();
    if (hidden && !reason.trim()) fail("needReason");
    await rpc("adm_opp_hidden", { oid: id, hide: hidden, reason });
  },

  async deleteOpportunity(id: string): Promise<void> {
    meAdmin("super");
    await rpc("adm_opp_delete", { oid: id });
  },

  async deleteUser(userId: string): Promise<void> {
    const a = meAdmin("super");
    if (userId === a.id) fail("deleteSelf");
    await rpc("adm_delete_user", { uid: userId });
  },

  /** make an existing account an admin: the person signs up first, then a super admin promotes them */
  async createAdmin(input: { name: string; email: string; password: string; level: AdminLevel }): Promise<void> {
    meAdmin("super");
    if (!EMAIL.test(norm(input.email))) fail("badEmail");
    await rpc("adm_promote", { target_email: norm(input.email), new_level: input.level });
  },

  async setAdminLevel(userId: string, level: AdminLevel): Promise<void> {
    const a = meAdmin("super");
    if (userId === a.id) fail("ownRole");
    await rpc("adm_set_level", { uid: userId, new_level: level });
  },

  async audit(): Promise<AuditEntry[]> {
    meAdmin();
    return getDb().audit;
  },
};

/* Telegram connected through the Lumora bot (supabase/functions/tg-bot) */
const telegram = {
  /** the signed-in person's connected Telegram, if any */
  link(): TelegramLink | null {
    const u = currentUser();
    return u ? (getDb().tgLinks.find((l) => l.userId === u.id) ?? null) : null;
  },
  /** one-time code: t.me/Lumora_connect_bot?start=<code> connects Telegram to this account */
  async code(): Promise<string> {
    if (!currentUser()) fail("signInFirst");
    const { data, error } = await supabase.rpc("channel_code");
    if (error) throw new ApiError(t("api.serverError"));
    return data as string;
  },
};

/** "@Name", "t.me/name" or "name" -> "name" */
export function normUsername(v: string): string {
  return v.trim().replace(/^(https?:\/\/)?(t\.me\/|telegram\.me\/)?@?/i, "").toLowerCase();
}

/** rows in other people's teams that are this person: by account or Telegram username */
export function myMemberRows(userId: string): TeamMember[] {
  const d = getDb();
  const names = new Set(d.myTgUsernames);
  return d.teamMembers.filter((m) => !m.declinedAt && !m.isLead && (m.userId === userId || (!!m.username && names.has(m.username))));
}

export const api = { auth, users, swipe, opportunities, hackathons, notifications, admin, telegram };
export type Api = typeof api;
