import { getDb, getSessionId, mutate, resetDb, setSessionId } from "./db";
import { hashPassword, randomHex, verifyPassword } from "./crypto";
import { t } from "../i18n";
import type {
  AdminLevel,
  AdminProfile,
  Application,
  ApplicationStatus,
  AuditEntry,
  Badge,
  CompanyProfile,
  CompanyStatus,
  DB,
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
} from "./types";

/* Mock API for the static GitHub Pages preview. Every call is async with a
   little latency, checks permissions like a real server would, and writes to
   the in-browser DB. A real backend can replace this module behind the same
   function signatures. Error and notification texts come from the "api" area
   of the dictionaries, so they follow the interface language. */

export class ApiError extends Error {}

const wait = (ms = 140 + Math.random() * 260) => new Promise((r) => setTimeout(r, ms));
const now = () => new Date().toISOString();
const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const norm = (s: string) => s.trim().toLowerCase();
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const fail = (code: string, vars?: Record<string, string | number>): never => {
  throw new ApiError(t(`api.${code}`, vars));
};
const tx = (code: string, vars?: Record<string, string | number>) => t(`api.${code}`, vars);

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

function pushNotification(d: DB, n: Omit<Notification, "id" | "read" | "at">) {
  d.notifications.unshift({ ...n, id: uid("n"), read: false, at: now() });
}
function pushAudit(d: DB, actor: AdminProfile, action: string, target: string, detail = "") {
  const entry: AuditEntry = { id: uid("au"), actorId: actor.id, actorName: actor.name, action, target, detail, at: now() };
  d.audit.unshift(entry);
}
function adminsOf(d: DB) {
  return d.users.filter((u): u is AdminProfile => u.kind === "admin");
}
function sendMail(d: DB, m: Omit<OutboxMail, "id" | "at">) {
  d.outbox.unshift({ ...m, id: uid("mail"), at: now() });
}
function newToken(d: DB, userId: string, kind: "reset" | "confirm", hours: number) {
  d.tokens = d.tokens.filter((x) => !(x.userId === userId && x.kind === kind));
  const token = randomHex(16);
  d.tokens.push({ token, userId, kind, expires: new Date(Date.now() + hours * 3600000).toISOString() });
  return token;
}
const appLink = (hash: string) => `${window.location.origin}${window.location.pathname}${hash}`;

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

const unverified = (): Verification => ({ level: "unverified", proof: "", proofValue: "", requestedAt: "", reviewedAt: "", note: "" });

/* ---------- auth ---------- */

const auth = {
  async login(email: string, password: string): Promise<User> {
    await wait();
    const cred = getDb().creds.find((c) => norm(c.email) === norm(email));
    if (!cred || !verifyPassword(password, cred.salt, cred.hash)) fail("wrongLogin");
    const user = findUser(cred!.userId) ?? fail("accountRemoved");
    setSessionId(user.id);
    return user;
  },

  async register(input: RegisterInput): Promise<User> {
    await wait();
    const email = norm(input.email);
    if (!EMAIL.test(email)) fail("badEmail");
    if (input.password.length < 8) fail("shortPassword");
    if (!input.name.trim()) fail(input.type === "talent" ? "noName" : "noOrgName");
    if (!input.city.trim()) fail("noCity");
    if (!input.consent) fail("noConsent");
    if (getDb().creds.some((c) => norm(c.email) === email)) fail("emailTaken");

    const id = uid(input.type === "talent" ? "t" : "c");
    const base = { id, email, name: input.name.trim(), city: input.city.trim(), createdAt: now(), verification: unverified(), onboarded: false, emailConfirmed: false, consentAt: now(), demo: false };
    const user: User =
      input.type === "talent"
        ? {
            ...base,
            kind: "talent",
            cat: input.cat,
            age: null,
            bio: "",
            skills: [],
            project: "",
            avail: "Part-time",
            contact: "",
            portfolio: "",
            verified: false,
            badges: [],
            photo: "",
            headline: "",
            region: input.city.trim(),
            education: { institution: "", level: "", program: "", year: "" },
            languages: [],
            experience: [],
            projects: [],
            cv: null,
            roles: [],
            workFormats: [],
            expectedStipend: "",
            github: "",
            linkedin: "",
          }
        : {
            ...base,
            kind: "company",
            orgKind: input.orgKind,
            tagline: "",
            industry: "",
            size: "",
            about: "",
            tags: [],
            website: "",
            contact: email,
            status: "pending",
            statusNote: "",
            verified: false,
            partner: false,
            hue: "#2552c4",
            logo: "",
            foundedYear: "",
            benefits: [],
            linkedin: "",
            telegram: "",
          };
    const salt = randomHex(16);
    mutate((d) => {
      d.users.push(user);
      d.creds.push({ email, hash: hashPassword(input.password, salt), salt, userId: id });
      const token = newToken(d, id, "confirm", 72);
      sendMail(d, { to: email, subject: tx("mail.confirmSubject"), body: tx("mail.confirmBody", { name: user.name }), link: appLink(`#/confirm?token=${token}`) });
      pushNotification(d, { userId: id, kind: "system", title: tx("n.welcomeTitle"), body: tx(user.kind === "talent" ? "n.welcomeTalent" : "n.welcomeCompany"), link: "#/onboarding" });
      if (user.kind === "company") {
        for (const a of adminsOf(d)) {
          pushNotification(d, { userId: a.id, kind: "company_status", title: tx("n.newCompanyTitle"), body: tx("n.newCompanyBody", { name: user.name }), link: "#/admin/companies" });
        }
      }
    });
    setSessionId(id);
    return user;
  },

  async logout() {
    await wait(80);
    setSessionId(null);
  },

  /** always answers the same way, so nobody can probe which emails have accounts */
  async requestReset(email: string): Promise<void> {
    await wait();
    if (!EMAIL.test(norm(email))) fail("badEmail");
    const cred = getDb().creds.find((c) => norm(c.email) === norm(email));
    if (!cred) return;
    mutate((d) => {
      const token = newToken(d, cred.userId, "reset", 1);
      sendMail(d, { to: cred.email, subject: tx("mail.resetSubject"), body: tx("mail.resetBody"), link: appLink(`#/reset?token=${token}`) });
    });
  },

  async checkToken(token: string, kind: "reset" | "confirm"): Promise<boolean> {
    await wait(60);
    const tk = getDb().tokens.find((x) => x.token === token && x.kind === kind);
    return !!tk && tk.expires > now();
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await wait();
    const tk = getDb().tokens.find((x) => x.token === token && x.kind === "reset");
    if (!tk || tk.expires < now()) fail("badToken");
    if (password.length < 8) fail("shortPassword");
    mutate((d) => {
      const cred = d.creds.find((c) => c.userId === tk!.userId);
      if (cred) {
        cred.salt = randomHex(16);
        cred.hash = hashPassword(password, cred.salt);
      }
      d.tokens = d.tokens.filter((x) => x.token !== token);
    });
  },

  async confirmEmail(token: string): Promise<void> {
    await wait();
    const tk = getDb().tokens.find((x) => x.token === token && x.kind === "confirm");
    if (!tk || tk.expires < now()) fail("badToken");
    mutate((d) => {
      const u = d.users.find((x) => x.id === tk!.userId);
      if (u && u.kind !== "admin") u.emailConfirmed = true;
      d.tokens = d.tokens.filter((x) => x.token !== token);
    });
  },

  async resendConfirm(): Promise<void> {
    await wait();
    const u = me();
    if (u.kind === "admin" || u.emailConfirmed) return;
    mutate((d) => {
      const token = newToken(d, u.id, "confirm", 72);
      sendMail(d, { to: u.email, subject: tx("mail.confirmSubject"), body: tx("mail.confirmBody", { name: u.name }), link: appLink(`#/confirm?token=${token}`) });
    });
  },

  async changePassword(oldPassword: string, password: string): Promise<void> {
    await wait();
    const u = me();
    const cred = getDb().creds.find((c) => c.userId === u.id) ?? fail("accountRemoved");
    if (!verifyPassword(oldPassword, cred.salt, cred.hash)) fail("wrongPassword");
    if (password.length < 8) fail("shortPassword");
    mutate((d) => {
      const c = d.creds.find((x) => x.userId === u.id)!;
      c.salt = randomHex(16);
      c.hash = hashPassword(password, c.salt);
    });
  },

  /** emails the preview "sent", newest first. There is no real mail server in the preview. */
  async outbox(email?: string): Promise<OutboxMail[]> {
    await wait(60);
    const to = email ? norm(email) : currentUser()?.email;
    return getDb().outbox.filter((m) => !to || norm(m.to) === norm(to));
  },

  async resetDemo() {
    await wait(120);
    resetDb();
    setSessionId(null);
  },
};

/* ---------- profiles ---------- */

type TalentPatch = Partial<Omit<TalentProfile, "kind" | "id" | "email" | "verified" | "badges" | "createdAt" | "verification" | "emailConfirmed" | "consentAt" | "demo">>;
type CompanyPatch = Partial<Omit<CompanyProfile, "kind" | "id" | "email" | "status" | "statusNote" | "verified" | "partner" | "createdAt" | "verification" | "emailConfirmed" | "consentAt" | "demo">>;

const MAX_FILE = 2_000_000; // characters of data URL, about 1.5 MB of file

const users = {
  async get(id: string): Promise<User | undefined> {
    await wait(80);
    return findUser(id);
  },

  /** public talent page, for signed-in companies, admins and the talent themself */
  async talent(id: string): Promise<TalentProfile> {
    await wait(100);
    me();
    const u = findUser(id);
    return u?.kind === "talent" ? u : fail("notFound");
  },

  async updateMe(patch: TalentPatch | CompanyPatch | { name?: string }): Promise<User> {
    await wait();
    const u = me();
    if ("name" in patch && patch.name !== undefined && !patch.name.trim()) fail("emptyName");
    for (const v of Object.values(patch)) {
      if (typeof v === "string" && v.startsWith("data:") && v.length > MAX_FILE) fail("fileTooBig");
      if (v && typeof v === "object" && "dataUrl" in v && String((v as { dataUrl: string }).dataUrl).length > MAX_FILE) fail("fileTooBig");
    }
    mutate((d) => {
      const target = d.users.find((x) => x.id === u.id)!;
      Object.assign(target, patch);
      // an edited verified profile stays verified; a rejected request can be sent again
    });
    return findUser(u.id)!;
  },

  async finishOnboarding(): Promise<void> {
    await wait(80);
    const u = me();
    mutate((d) => {
      const x = d.users.find((v) => v.id === u.id);
      if (x && x.kind !== "admin") x.onboarded = true;
    });
  },

  /**
   * Ask for the verified mark. The profile must be complete. A Lumora result is checked
   * automatically; other proofs go to the admin queue.
   */
  async requestVerification(proof: VerificationProof, proofValue = ""): Promise<Verification> {
    await wait();
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
    const auto = proof === "event" && p.kind === "talent" && p.badges.length > 0;
    if (proof === "event" && !auto) {
      const joined = getDb().teams.some((x) => x.leadId === p.id && getDb().hackathons.find((h) => h.id === x.hackathonId)?.status === "finished");
      if (!joined) fail("noEvent");
    }
    const v: Verification = {
      level: auto ? "verified" : "pending",
      proof,
      proofValue: proofValue.trim() || (auto ? p.kind === "talent" ? p.badges[0].hackathonName : "" : ""),
      requestedAt: now(),
      reviewedAt: auto ? now() : "",
      note: "",
    };
    mutate((d) => {
      const x = d.users.find((y) => y.id === p.id) as TalentProfile | CompanyProfile;
      x.verification = v;
      if (auto) {
        x.verified = true;
        pushNotification(d, { userId: x.id, kind: "verified", title: tx("n.verifiedTitle"), body: tx("n.verifiedBody"), link: "#/app/profile" });
      } else {
        for (const a of adminsOf(d)) pushNotification(d, { userId: a.id, kind: "verified", title: tx("n.verifyRequestTitle"), body: tx("n.verifyRequestBody", { name: x.name }), link: "#/admin/verification" });
      }
    });
    return v;
  },

  async talents(q = "", cat = ""): Promise<TalentProfile[]> {
    await wait();
    const s = norm(q);
    return getDb()
      .users.filter((u): u is TalentProfile => u.kind === "talent")
      .filter((x) => (!cat || x.cat === cat) && (!s || norm(`${x.name} ${x.city} ${x.headline} ${x.skills.join(" ")}`).includes(s)));
  },

  async companies(): Promise<CompanyProfile[]> {
    await wait();
    return getDb().users.filter((u): u is CompanyProfile => u.kind === "company" && u.status === "approved");
  },

  /** public company page: profile plus its open postings */
  async company(id: string): Promise<{ company: CompanyProfile; openings: Opportunity[] }> {
    await wait(100);
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
    await wait(100);
    return getDb()
      .users.filter((u): u is TalentProfile => u.kind === "talent" && u.badges.length > 0)
      .sort((a, b) => (b.badges.at(-1)?.awardedAt ?? "").localeCompare(a.badges.at(-1)?.awardedAt ?? ""))
      .slice(0, limit);
  },

  async stats() {
    await wait(60);
    return statsNow();
  },
};

/** sync stats, so counters can render real numbers on the first frame */
export function statsNow() {
  const d = getDb();
  const open = d.opportunities.filter((o) => !o.hidden && !o.closed);
  const byCat: Record<string, number> = {};
  for (const o of open) for (const c of o.cats) byCat[c] = (byCat[c] ?? 0) + 1;
  return {
    talents: d.users.filter((u) => u.kind === "talent").length,
    verifiedTalents: d.users.filter((u) => u.kind === "talent" && u.verified).length,
    companies: d.users.filter((u) => u.kind === "company" && u.status === "approved").length,
    pendingCompanies: d.users.filter((u) => u.kind === "company" && u.status === "pending").length,
    pendingVerifications: d.users.filter((u) => u.kind !== "admin" && u.verification.level === "pending").length,
    openOpportunities: open.length,
    hiddenOpportunities: d.opportunities.filter((o) => o.hidden).length,
    opportunitiesByCat: byCat,
    events: d.hackathons.filter((h) => h.status !== "draft").length,
    cities: new Set(d.hackathons.filter((h) => h.mode !== "online").map((h) => h.city)).size,
    teams: d.teams.length,
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
    await wait();
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
    await wait(120);
    const u = me();
    if (u.kind === "admin") fail("adminsNoSwipe");
    if (u.kind === "company") meApprovedCompany();
    let match: Match | null = null;
    mutate((d) => {
      d.swipes = d.swipes.filter((s) => !(s.fromId === u.id && s.toId === toId));
      d.swipes.push({ fromId: u.id, toId, dir, at: now() });
      if (dir === 1 && d.swipes.some((s) => s.fromId === toId && s.toId === u.id && s.dir === 1)) {
        const other = d.users.find((x) => x.id === toId)!;
        const talentId = u.kind === "talent" ? u.id : toId;
        const companyId = u.kind === "talent" ? toId : u.id;
        match = { id: matchId(talentId, companyId), talentId, companyId, at: now() };
        pushNotification(d, { userId: toId, kind: "match", title: tx("n.matchTitle", { name: u.name }), body: tx("n.matchBody"), link: `#/app/inbox/${match.id}` });
        pushNotification(d, { userId: u.id, kind: "match", title: tx("n.matchTitle", { name: other.name }), body: tx("n.matchBody"), link: `#/app/inbox/${match.id}` });
      }
    });
    return { match };
  },

  /** clear my own swipes that did not end in a match */
  async resetDeck() {
    await wait();
    const u = me();
    const keep = new Set(matchesFor(u.id).map((m) => (u.kind === "talent" ? m.companyId : m.talentId)));
    mutate((d) => {
      d.swipes = d.swipes.filter((s) => s.fromId !== u.id || keep.has(s.toId));
    });
  },

  async liked(): Promise<User[]> {
    await wait(100);
    const u = me();
    const d = getDb();
    return d.swipes
      .filter((s) => s.fromId === u.id && s.dir === 1)
      .map((s) => findUser(s.toId))
      .filter((x): x is User => !!x);
  },

  async matches(): Promise<(Match & { other: User; last: Message | null })[]> {
    await wait();
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
    await wait(100);
    const u = me();
    if (!matchesFor(u.id).some((m) => m.id === id)) fail("noConversation");
    return getDb().messages.filter((m) => m.matchId === id);
  },

  async send(id: string, text: string): Promise<Message> {
    await wait(90);
    const u = me();
    const m = matchesFor(u.id).find((x) => x.id === id) ?? fail("noConversation");
    if (!text.trim()) fail("emptyMessage");
    const msg: Message = { id: uid("m"), matchId: id, fromId: u.id, text: text.trim(), at: now() };
    mutate((d) => {
      d.messages.push(msg);
      const to = u.id === m.talentId ? m.companyId : m.talentId;
      pushNotification(d, { userId: to, kind: "match", title: tx("n.messageTitle", { name: u.name }), body: msg.text.slice(0, 80), link: `#/app/inbox/${id}` });
    });
    return msg;
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
    await wait();
    return listNow();
  },

  async get(id: string): Promise<OpportunityDetail> {
    await wait(100);
    const d = getDb();
    const o = d.opportunities.find((x) => x.id === id);
    const u = currentUser();
    const own = u?.kind === "company" && o?.companyId === u.id;
    if (!o || (!visible(o) && !own && u?.kind !== "admin")) fail("notFound");
    return {
      ...withCompany(o!),
      applicants: d.applications.filter((a) => a.opportunityId === id).length,
      myApplication: u?.kind === "talent" ? (d.applications.find((a) => a.opportunityId === id && a.talentId === u.id) ?? null) : null,
    };
  },

  /** company dashboard: my postings including hidden ones */
  async mine(): Promise<OpportunityWithCompany[]> {
    await wait();
    const c = meCompany();
    return getDb()
      .opportunities.filter((o) => o.companyId === c.id)
      .sort((a, b) => b.postedAt.localeCompare(a.postedAt))
      .map(withCompany);
  },

  async create(input: OpportunityInput): Promise<Opportunity> {
    await wait();
    const c = meApprovedCompany();
    validateOpportunity(input);
    const o: Opportunity = { ...input, id: uid("o"), companyId: c.id, postedAt: now(), hidden: false, hiddenReason: "", demo: false };
    mutate((d) => {
      d.opportunities.unshift(o);
    });
    return o;
  },

  async update(id: string, patch: Partial<OpportunityInput>): Promise<void> {
    await wait();
    const c = meCompany();
    const o = getDb().opportunities.find((x) => x.id === id) ?? fail("postingNotFound");
    if (o.companyId !== c.id) fail("notYourPosting");
    validateOpportunity({ ...o, ...patch });
    mutate((d) => {
      Object.assign(d.opportunities.find((x) => x.id === id)!, patch);
    });
  },

  async remove(id: string): Promise<void> {
    await wait();
    const c = meCompany();
    const o = getDb().opportunities.find((x) => x.id === id) ?? fail("postingNotFound");
    if (o.companyId !== c.id) fail("notYourPosting");
    mutate((d) => {
      d.opportunities = d.opportunities.filter((x) => x.id !== id);
      d.applications = d.applications.filter((a) => a.opportunityId !== id);
    });
  },

  async apply(opportunityId: string, input: ApplyInput = { cover: "", answers: [], withCv: false }): Promise<Application> {
    await wait();
    const tal = meTalent();
    const d0 = getDb();
    const o = d0.opportunities.find((x) => x.id === opportunityId && !x.hidden) ?? fail("postingGone");
    if (o.closed || (o.deadline && o.deadline < localNow().slice(0, 10))) fail("postingClosed");
    if (d0.applications.some((a) => a.opportunityId === opportunityId && a.talentId === tal.id)) fail("alreadyApplied");
    if (o.questions.some((_, i) => !input.answers[i]?.trim())) fail("answerAll");
    if (input.withCv && !tal.cv) fail("noCv");
    const app: Application = {
      id: uid("ap"),
      opportunityId,
      talentId: tal.id,
      status: "pending",
      note: "",
      createdAt: now(),
      updatedAt: now(),
      cover: input.cover.trim(),
      answers: input.answers.map((a) => a.trim()),
      withCv: input.withCv,
    };
    mutate((d) => {
      d.applications.push(app);
      pushNotification(d, {
        userId: o.companyId,
        kind: "application",
        title: tx(o.type === "Event" ? "n.newRegistration" : "n.newApplicant"),
        body: tx(o.type === "Event" ? "n.registeredFor" : "n.appliedTo", { name: tal.name, title: o.title }),
        link: "#/app/dashboard",
      });
    });
    return app;
  },

  async withdraw(applicationId: string): Promise<void> {
    await wait();
    const tal = meTalent();
    const a = getDb().applications.find((x) => x.id === applicationId && x.talentId === tal.id) ?? fail("notFound");
    if (a.status === "accepted") fail("cannotWithdraw");
    mutate((d) => {
      d.applications = d.applications.filter((x) => x.id !== applicationId);
    });
  },

  async myApplications(): Promise<ApplicationWithOpportunity[]> {
    await wait();
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
    await wait();
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
    await wait();
    const c = meCompany();
    const d0 = getDb();
    const app = d0.applications.find((a) => a.id === applicationId) ?? fail("notFound");
    const o = d0.opportunities.find((x) => x.id === app.opportunityId)!;
    if (o.companyId !== c.id) fail("notYourApplicant");
    mutate((d) => {
      const a = d.applications.find((x) => x.id === applicationId)!;
      a.status = status;
      a.note = note;
      a.updatedAt = now();
      pushNotification(d, {
        userId: a.talentId,
        kind: "application",
        title: tx(`n.status_${status}_title`),
        body: tx(`n.status_${status}_body`, { company: c.name, title: o.title }) + (note ? ` ${tx("n.note", { note })}` : ""),
        link: `#/jobs/${o.id}`,
      });
    });
  },
};

/** sync list for first paint on the landing page */
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

export type TeamWithLead = TeamRegistration & { lead: TalentProfile | undefined };

const PUBLIC_STATUSES: Hackathon["status"][] = ["published", "registration_open", "registration_closed", "in_progress", "finished", "cancelled"];

const hackathons = {
  /** everyone sees non-draft events; admins also see drafts */
  async list(opts: { includeDrafts?: boolean } = {}): Promise<Hackathon[]> {
    await wait();
    const u = currentUser();
    const showDrafts = opts.includeDrafts && u?.kind === "admin";
    return getDb()
      .hackathons.filter((h) => showDrafts || PUBLIC_STATUSES.includes(h.status))
      .sort((a, b) => a.start.localeCompare(b.start));
  },

  async get(id: string): Promise<Hackathon | undefined> {
    await wait(80);
    return getDb().hackathons.find((h) => h.id === id);
  },

  async create(input: HackathonInput): Promise<Hackathon> {
    await wait();
    const a = meAdmin();
    validateEvent(input);
    const h: Hackathon = { podium: [], participants: 0, photo: "", demo: false, ...input, id: uid("h"), results: [], createdAt: now(), updatedAt: now() };
    mutate((d) => {
      d.hackathons.push(h);
      pushAudit(d, a, "event.create", h.title, `${h.places.length} places, status ${h.status}`);
    });
    return h;
  },

  async update(id: string, patch: Partial<HackathonInput>): Promise<Hackathon> {
    await wait();
    const a = meAdmin();
    const before = getDb().hackathons.find((h) => h.id === id) ?? fail("eventNotFound");
    const next = { ...before, ...patch };
    validateEvent(next);
    mutate((d) => {
      const h = d.hackathons.find((x) => x.id === id)!;
      Object.assign(h, patch, { updatedAt: now() });
      const changed = Object.keys(patch).filter((k) => JSON.stringify((before as never)[k]) !== JSON.stringify((patch as never)[k]));
      pushAudit(d, a, "event.update", h.title, changed.length ? `Changed: ${changed.join(", ")}` : "Saved without changes");
      if (patch.status && patch.status !== before.status) {
        if (["registration_closed", "in_progress", "cancelled", "finished"].includes(patch.status)) {
          for (const tm of d.teams.filter((x) => x.hackathonId === id)) {
            pushNotification(d, {
              userId: tm.leadId,
              kind: "event",
              title: `${h.title}: ${statusLabel(patch.status)}`,
              body: tx(patch.status === "cancelled" ? "n.eventCancelled" : "n.eventCheck"),
              link: `#/app/hackathons/${id}`,
            });
          }
        }
      }
    });
    return getDb().hackathons.find((h) => h.id === id)!;
  },

  async remove(id: string): Promise<void> {
    await wait();
    const a = meAdmin("super");
    const h = getDb().hackathons.find((x) => x.id === id) ?? fail("eventNotFound");
    mutate((d) => {
      d.hackathons = d.hackathons.filter((x) => x.id !== id);
      d.teams = d.teams.filter((tm) => tm.hackathonId !== id);
      pushAudit(d, a, "event.delete", h.title);
    });
  },

  async registerTeam(hackathonId: string, input: TeamInput): Promise<TeamRegistration> {
    await wait();
    const tal = meTalent();
    const d0 = getDb();
    const h = d0.hackathons.find((x) => x.id === hackathonId) ?? fail("eventNotFound");
    if (h.status !== "registration_open") fail("regNotOpen");
    const nowLocal = localNow();
    if (h.regOpen && nowLocal < h.regOpen) fail("regOpensOn", { date: h.regOpen.replace("T", " ") });
    if (h.regClose && nowLocal > h.regClose) fail("regClosed");
    const teamsHere = d0.teams.filter((x) => x.hackathonId === hackathonId);
    if (teamsHere.some((x) => x.leadId === tal.id)) fail("alreadyRegistered");
    if (h.maxTeams && teamsHere.length >= h.maxTeams) fail("eventFull");
    if (!input.teamName.trim()) fail("noTeamName");
    const size = input.members.filter((m) => m.trim()).length;
    if (size === 1 && !h.soloAllowed && h.teamMin > 1) fail("noSolo", { n: h.teamMin });
    if (size > 1 && size < h.teamMin) fail("teamMin", { n: h.teamMin });
    if (size > h.teamMax) fail("teamMax", { n: h.teamMax });
    if (input.track && !h.tracks.includes(input.track)) fail("badTrack");
    if (h.registrationFields.github && !input.github.trim()) fail("needGithub");
    if (h.registrationFields.portfolio && !input.portfolio.trim()) fail("needPortfolio");
    if (h.registrationFields.motivation && !input.motivation.trim()) fail("needMotivation");
    if (h.registrationFields.phone && !input.phone.trim()) fail("needPhone");
    const team: TeamRegistration = { ...input, id: uid("tm"), hackathonId, leadId: tal.id, createdAt: now() };
    mutate((d) => {
      d.teams.push(team);
      pushNotification(d, { userId: tal.id, kind: "event", title: tx("n.registeredTitle", { title: h.title }), body: tx("n.registeredBody", { team: team.teamName }), link: `#/app/hackathons/${h.id}` });
    });
    return team;
  },

  async cancelMyTeam(hackathonId: string): Promise<void> {
    await wait();
    const tal = meTalent();
    mutate((d) => {
      d.teams = d.teams.filter((x) => !(x.hackathonId === hackathonId && x.leadId === tal.id));
    });
  },

  async myTeams(): Promise<TeamRegistration[]> {
    await wait(100);
    const u = currentUser();
    if (!u || u.kind !== "talent") return [];
    return getDb().teams.filter((x) => x.leadId === u.id);
  },

  async teams(hackathonId: string): Promise<TeamWithLead[]> {
    await wait();
    meAdmin();
    return getDb()
      .teams.filter((x) => x.hackathonId === hackathonId)
      .map((x) => ({ ...x, lead: findUser(x.leadId) as TalentProfile | undefined }));
  },

  async teamCounts(): Promise<Record<string, number>> {
    await wait(60);
    const out: Record<string, number> = {};
    for (const tm of getDb().teams) out[tm.hackathonId] = (out[tm.hackathonId] ?? 0) + 1;
    return out;
  },

  /** assign results and award badges to the team leads */
  async setResults(hackathonId: string, results: Result[]): Promise<void> {
    await wait();
    const a = meAdmin();
    const d0 = getDb();
    const h = d0.hackathons.find((x) => x.id === hackathonId) ?? fail("eventNotFound");
    const teamIds = new Set(d0.teams.filter((tm) => tm.hackathonId === hackathonId).map((tm) => tm.id));
    for (const r of results) if (!teamIds.has(r.teamId)) fail("resultBadTeam");
    mutate((d) => {
      const ev = d.hackathons.find((x) => x.id === hackathonId)!;
      ev.results = results;
      ev.updatedAt = now();
      for (const u of d.users) if (u.kind === "talent") u.badges = u.badges.filter((b) => b.hackathonId !== hackathonId);
      for (const r of results) {
        const team = d.teams.find((tm) => tm.id === r.teamId)!;
        const lead = d.users.find((u) => u.id === team.leadId);
        if (!lead || lead.kind !== "talent") continue;
        const [kind, value] = r.key.split(":");
        const place = kind === "place" ? Number(value) : null;
        const title = kind === "place" ? (h.places.find((p) => p.place === place)?.title ?? `${place} place`) : kind === "nom" ? value : "Finalist";
        const badge: Badge = { id: uid("b"), hackathonId, hackathonName: h.title, place, title, teamName: team.teamName, awardedAt: now() };
        lead.badges.push(badge);
        pushNotification(d, { userId: lead.id, kind: "badge", title: tx("n.badgeTitle"), body: tx("n.badgeBody", { title, event: h.title }), link: "#/app/profile" });
      }
      pushAudit(d, a, "event.results", h.title, `${results.length} results assigned`);
    });
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

const notifications = {
  async list(): Promise<Notification[]> {
    await wait(100);
    const u = me();
    return getDb().notifications.filter((n) => n.userId === u.id);
  },
  async markRead(id: string) {
    await wait(40);
    mutate((d) => {
      const n = d.notifications.find((x) => x.id === id);
      if (n) n.read = true;
    });
  },
  async markAllRead() {
    await wait(60);
    const u = me();
    mutate((d) => {
      for (const n of d.notifications) if (n.userId === u.id) n.read = true;
    });
  },
};

/* ---------- admin ---------- */

export type UserFilter = { role?: "talent" | "company" | "admin" | ""; status?: CompanyStatus | "verified" | "unverified" | ""; q?: string };

const admin = {
  async users(f: UserFilter = {}): Promise<User[]> {
    await wait();
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
    await wait();
    meAdmin();
    return getDb()
      .users.filter((u): u is CompanyProfile => u.kind === "company" && u.status === "pending")
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  async setCompanyStatus(companyId: string, status: Exclude<CompanyStatus, "pending">, note = ""): Promise<void> {
    await wait();
    const a = meAdmin();
    const c = (findUser(companyId) as CompanyProfile | undefined) ?? fail("notFound");
    if (status === "rejected" && !note.trim()) fail("needReason");
    mutate((d) => {
      const x = d.users.find((u) => u.id === companyId) as CompanyProfile;
      x.status = status;
      x.statusNote = note;
      pushNotification(d, {
        userId: companyId,
        kind: "company_status",
        title: tx(status === "approved" ? "n.companyApprovedTitle" : "n.companyRejectedTitle"),
        body: status === "approved" ? tx("n.companyApprovedBody") : tx("n.note", { note }),
        link: "#/app/dashboard",
      });
      pushAudit(d, a, status === "approved" ? "company.approve" : "company.reject", c.name, note);
    });
  },

  /** people and companies who asked for the verified mark */
  async verificationQueue(): Promise<(TalentProfile | CompanyProfile)[]> {
    await wait();
    meAdmin();
    return getDb()
      .users.filter((u): u is TalentProfile | CompanyProfile => u.kind !== "admin" && u.verification.level === "pending")
      .sort((a, b) => a.verification.requestedAt.localeCompare(b.verification.requestedAt));
  },

  async reviewVerification(userId: string, approve: boolean, note = ""): Promise<void> {
    await wait();
    const a = meAdmin();
    const u = findUser(userId);
    if (!u || u.kind === "admin") fail("notFound");
    if (!approve && !note.trim()) fail("needReason");
    mutate((d) => {
      const x = d.users.find((v) => v.id === userId) as TalentProfile | CompanyProfile;
      x.verification = { ...x.verification, level: approve ? "verified" : "unverified", reviewedAt: now(), note };
      x.verified = approve;
      pushNotification(d, {
        userId,
        kind: "verified",
        title: tx(approve ? "n.verifiedTitle" : "n.verifyDeclinedTitle"),
        body: approve ? tx("n.verifiedBody") : tx("n.note", { note }),
        link: "#/app/profile",
      });
      pushAudit(d, a, approve ? "user.verify" : "user.verify_decline", x.name, `${x.verification.proof} ${x.verification.proofValue} ${note}`.trim());
    });
  },

  async setVerified(userId: string, verified: boolean): Promise<void> {
    await wait();
    const a = meAdmin();
    const u = findUser(userId) ?? fail("notFound");
    if (u.kind === "admin") fail("adminNotVerified");
    mutate((d) => {
      const x = d.users.find((v) => v.id === userId) as TalentProfile | CompanyProfile;
      x.verified = verified;
      x.verification = verified
        ? { level: "verified", proof: "admin", proofValue: a.name, requestedAt: x.verification.requestedAt || now(), reviewedAt: now(), note: "" }
        : unverified();
      if (verified) pushNotification(d, { userId, kind: "verified", title: tx("n.verifiedTitle"), body: tx("n.verifiedBody"), link: "#/app/profile" });
      pushAudit(d, a, verified ? "user.verify" : "user.unverify", u.name, u.kind);
    });
  },

  async awardBadge(talentId: string, b: { hackathonId: string; place: number | null; title: string; teamName?: string }): Promise<void> {
    await wait();
    const a = meAdmin();
    const tl = findUser(talentId);
    if (!tl || tl.kind !== "talent") fail("pickTalent");
    const h = getDb().hackathons.find((x) => x.id === b.hackathonId) ?? fail("pickEvent");
    if (!b.title.trim()) fail("badgeTitle");
    mutate((d) => {
      const x = d.users.find((v) => v.id === talentId) as TalentProfile;
      x.badges.push({ id: uid("b"), hackathonId: h.id, hackathonName: h.title, place: b.place, title: b.title.trim(), teamName: b.teamName, awardedAt: now() });
      pushNotification(d, { userId: talentId, kind: "badge", title: tx("n.badgeTitle"), body: tx("n.badgeBody", { title: b.title, event: h.title }), link: "#/app/profile" });
      pushAudit(d, a, "badge.award", tl!.name, `${b.title}, ${h.title}`);
    });
  },

  async revokeBadge(talentId: string, badgeId: string): Promise<void> {
    await wait();
    const a = meAdmin("super");
    const tl = findUser(talentId) as TalentProfile | undefined;
    const badge = tl?.badges.find((b) => b.id === badgeId) ?? fail("notFound");
    mutate((d) => {
      const x = d.users.find((v) => v.id === talentId) as TalentProfile;
      x.badges = x.badges.filter((b) => b.id !== badgeId);
      pushAudit(d, a, "badge.revoke", tl!.name, `${badge.title}, ${badge.hackathonName}`);
    });
  },

  async opportunities(): Promise<OpportunityWithCompany[]> {
    await wait();
    meAdmin();
    return getDb()
      .opportunities.slice()
      .sort((a, b) => Number(b.hidden) - Number(a.hidden) || b.postedAt.localeCompare(a.postedAt))
      .map(withCompany);
  },

  async setOpportunityHidden(id: string, hidden: boolean, reason = ""): Promise<void> {
    await wait();
    const a = meAdmin();
    const o = getDb().opportunities.find((x) => x.id === id) ?? fail("postingNotFound");
    if (hidden && !reason.trim()) fail("needReason");
    mutate((d) => {
      const x = d.opportunities.find((v) => v.id === id)!;
      x.hidden = hidden;
      x.hiddenReason = hidden ? reason : "";
      pushNotification(d, {
        userId: o.companyId,
        kind: "system",
        title: tx(hidden ? "n.postingHiddenTitle" : "n.postingVisibleTitle"),
        body: hidden ? `${o.title}: ${reason}` : o.title,
        link: "#/app/dashboard",
      });
      pushAudit(d, a, hidden ? "opportunity.hide" : "opportunity.restore", o.title, reason);
    });
  },

  async deleteOpportunity(id: string): Promise<void> {
    await wait();
    const a = meAdmin("super");
    const o = getDb().opportunities.find((x) => x.id === id) ?? fail("postingNotFound");
    mutate((d) => {
      d.opportunities = d.opportunities.filter((x) => x.id !== id);
      d.applications = d.applications.filter((x) => x.opportunityId !== id);
      pushAudit(d, a, "opportunity.delete", o.title);
    });
  },

  async deleteUser(userId: string): Promise<void> {
    await wait();
    const a = meAdmin("super");
    if (userId === a.id) fail("deleteSelf");
    const u = findUser(userId) ?? fail("notFound");
    mutate((d) => {
      d.users = d.users.filter((x) => x.id !== userId);
      d.creds = d.creds.filter((x) => x.userId !== userId);
      d.tokens = d.tokens.filter((x) => x.userId !== userId);
      d.swipes = d.swipes.filter((s) => s.fromId !== userId && s.toId !== userId);
      d.applications = d.applications.filter((x) => x.talentId !== userId);
      d.opportunities = d.opportunities.filter((x) => x.companyId !== userId);
      d.notifications = d.notifications.filter((x) => x.userId !== userId);
      d.teams = d.teams.filter((x) => x.leadId !== userId);
      pushAudit(d, a, "user.delete", u.name, u.kind);
    });
  },

  async createAdmin(input: { name: string; email: string; password: string; level: AdminLevel }): Promise<void> {
    await wait();
    const a = meAdmin("super");
    const email = norm(input.email);
    if (!input.name.trim()) fail("emptyName");
    if (!EMAIL.test(email)) fail("badEmail");
    if (input.password.length < 8) fail("shortPassword");
    if (getDb().creds.some((c) => norm(c.email) === email)) fail("emailTaken");
    const id = uid("a");
    const salt = randomHex(16);
    mutate((d) => {
      d.users.push({ kind: "admin", id, email, name: input.name.trim(), level: input.level, createdAt: now() });
      d.creds.push({ email, hash: hashPassword(input.password, salt), salt, userId: id });
      pushAudit(d, a, "admin.create", input.name, input.level);
    });
  },

  async setAdminLevel(userId: string, level: AdminLevel): Promise<void> {
    await wait();
    const a = meAdmin("super");
    if (userId === a.id) fail("ownRole");
    const u = findUser(userId);
    if (!u || u.kind !== "admin") fail("notAdmin");
    mutate((d) => {
      (d.users.find((x) => x.id === userId) as AdminProfile).level = level;
      pushAudit(d, a, "admin.role", u!.name, level);
    });
  },

  async audit(): Promise<AuditEntry[]> {
    await wait();
    meAdmin();
    return getDb().audit;
  },
};

export const api = { auth, users, swipe, opportunities, hackathons, notifications, admin };
export type Api = typeof api;
