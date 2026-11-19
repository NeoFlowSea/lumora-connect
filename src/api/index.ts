import { getDb, getSessionId, mutate, resetDb, setSessionId } from "./db";
import type {
  AdminLevel,
  AdminProfile,
  Application,
  ApplicationStatus,
  AuditEntry,
  Badge,
  CompanyProfile,
  CompanyStatus,
  Hackathon,
  HackathonInput,
  Match,
  Message,
  Notification,
  Opportunity,
  OpportunityInput,
  RegisterInput,
  Result,
  TalentProfile,
  TeamInput,
  TeamRegistration,
  User,
} from "./types";

/* Mock API for the static GitHub Pages preview. Every call is async with a
   little latency, checks permissions like a real server would, and writes to
   the in-browser DB. A real backend can replace this module behind the same
   function signatures. */

export class ApiError extends Error {}

const wait = (ms = 140 + Math.random() * 260) => new Promise((r) => setTimeout(r, ms));
const now = () => new Date().toISOString();
const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const norm = (s: string) => s.trim().toLowerCase();
const fail = (msg: string): never => {
  throw new ApiError(msg);
};

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
  return currentUser() ?? fail("Please sign in first.");
}
function meTalent(): TalentProfile {
  const u = me();
  return u.kind === "talent" ? u : fail("Only talent accounts can do this.");
}
function meCompany(): CompanyProfile {
  const u = me();
  return u.kind === "company" ? u : fail("Only company accounts can do this.");
}
function meApprovedCompany(): CompanyProfile {
  const c = meCompany();
  if (c.status !== "approved") fail("Your company is waiting for admin approval.");
  return c;
}
function meAdmin(level?: AdminLevel): AdminProfile {
  const u = me();
  if (u.kind !== "admin") fail("Admins only.");
  const a = u as AdminProfile;
  if (level === "super" && a.level !== "super") fail("Only a super admin can do this.");
  return a;
}

function pushNotification(d: ReturnType<typeof getDb>, n: Omit<Notification, "id" | "read" | "at">) {
  d.notifications.unshift({ ...n, id: uid("n"), read: false, at: now() });
}
function pushAudit(d: ReturnType<typeof getDb>, actor: AdminProfile, action: string, target: string, detail = "") {
  const entry: AuditEntry = { id: uid("au"), actorId: actor.id, actorName: actor.name, action, target, detail, at: now() };
  d.audit.unshift(entry);
}
function adminsOf(d: ReturnType<typeof getDb>) {
  return d.users.filter((u): u is AdminProfile => u.kind === "admin");
}

/* ---------- auth ---------- */

const auth = {
  async login(email: string, password: string): Promise<User> {
    await wait();
    const cred = getDb().creds.find((c) => norm(c.email) === norm(email));
    if (!cred) fail("No account with this email.");
    if (cred!.password !== password) fail("Wrong password. Check the demo table if you are trying a demo account.");
    const user = findUser(cred!.userId) ?? fail("This account was removed.");
    setSessionId(user.id);
    return user;
  },

  async register(input: RegisterInput): Promise<User> {
    await wait();
    const email = norm(input.email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("Enter a valid email address.");
    if (input.password.length < 8) fail("Password needs at least 8 characters.");
    if (!input.name.trim()) fail(input.type === "talent" ? "Enter your full name." : "Enter the company or organization name.");
    if (getDb().creds.some((c) => norm(c.email) === email)) fail("An account with this email already exists. Sign in instead.");

    const id = uid(input.type === "talent" ? "t" : "c");
    let user: User;
    if (input.type === "talent") {
      user = {
        kind: "talent",
        id,
        email,
        name: input.name.trim(),
        cat: input.cat,
        city: input.city.trim(),
        age: input.age,
        bio: "",
        skills: input.skills,
        project: "",
        avail: "Part-time",
        contact: input.contact.trim(),
        portfolio: "",
        verified: false,
        badges: [],
        createdAt: now(),
      };
    } else {
      user = {
        kind: "company",
        id,
        email,
        name: input.name.trim(),
        orgKind: input.orgKind,
        tagline: "",
        industry: input.industry.trim(),
        city: input.city.trim(),
        size: input.size,
        about: input.about.trim(),
        tags: [],
        website: input.website.trim(),
        contact: input.contact.trim(),
        status: "pending",
        statusNote: "",
        verified: false,
        partner: false,
        hue: "#2552c4",
        createdAt: now(),
      };
    }
    mutate((d) => {
      d.users.push(user);
      d.creds.push({ email, password: input.password, userId: id });
      if (user.kind === "talent") {
        pushNotification(d, {
          userId: id,
          kind: "system",
          title: "Welcome to Lumora Connect",
          body: "Fill in your profile and join a hackathon. Admins verify accounts after a first event.",
          link: "#/app/profile",
        });
      } else {
        pushNotification(d, {
          userId: id,
          kind: "company_status",
          title: "Waiting for approval",
          body: `A Lumora admin will review ${user.name}. You can prepare postings meanwhile.`,
          link: "#/app/dashboard",
        });
        for (const a of adminsOf(d)) {
          pushNotification(d, {
            userId: a.id,
            kind: "company_status",
            title: "New company to review",
            body: `${user.name} registered and waits for approval.`,
            link: "#/admin/companies",
          });
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

  async resetDemo() {
    await wait(120);
    resetDb();
    setSessionId(null);
  },
};

/* ---------- profiles ---------- */

type TalentPatch = Partial<Pick<TalentProfile, "name" | "cat" | "city" | "age" | "bio" | "skills" | "project" | "avail" | "contact" | "portfolio">>;
type CompanyPatch = Partial<Pick<CompanyProfile, "name" | "tagline" | "industry" | "city" | "size" | "about" | "tags" | "website" | "contact" | "orgKind">>;

const users = {
  async get(id: string): Promise<User | undefined> {
    await wait(80);
    return findUser(id);
  },

  async updateMe(patch: TalentPatch | CompanyPatch | { name?: string }): Promise<User> {
    await wait();
    const u = me();
    if ("name" in patch && patch.name !== undefined && !patch.name.trim()) fail("Name cannot be empty.");
    mutate((d) => {
      const target = d.users.find((x) => x.id === u.id)!;
      Object.assign(target, patch);
    });
    return findUser(u.id)!;
  },

  async talents(q = "", cat = ""): Promise<TalentProfile[]> {
    await wait();
    const s = norm(q);
    return getDb()
      .users.filter((u): u is TalentProfile => u.kind === "talent")
      .filter((t) => (!cat || t.cat === cat) && (!s || norm(`${t.name} ${t.city} ${t.skills.join(" ")}`).includes(s)));
  },

  async companies(): Promise<CompanyProfile[]> {
    await wait();
    return getDb().users.filter((u): u is CompanyProfile => u.kind === "company" && u.status === "approved");
  },

  /** winners strip on the landing page: talents with at least one ranked badge */
  async winners(limit = 8): Promise<TalentProfile[]> {
    await wait(100);
    return getDb()
      .users.filter((u): u is TalentProfile => u.kind === "talent" && u.badges.length > 0)
      .sort((a, b) => (b.badges.at(-1)?.awardedAt ?? "").localeCompare(a.badges.at(-1)?.awardedAt ?? ""))
      .slice(0, limit);
  },

  async stats() {
    await wait(80);
    const d = getDb();
    return {
      talents: d.users.filter((u) => u.kind === "talent").length,
      verifiedTalents: d.users.filter((u) => u.kind === "talent" && u.verified).length,
      companies: d.users.filter((u) => u.kind === "company" && u.status === "approved").length,
      pendingCompanies: d.users.filter((u) => u.kind === "company" && u.status === "pending").length,
      openOpportunities: d.opportunities.filter((o) => !o.hidden).length,
      hiddenOpportunities: d.opportunities.filter((o) => o.hidden).length,
      events: d.hackathons.filter((h) => h.status !== "draft").length,
      cities: new Set(d.hackathons.filter((h) => h.mode !== "online").map((h) => h.city)).size,
      teams: d.teams.length,
    };
  },
};

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
      return d.users.filter((x): x is TalentProfile => x.kind === "talent" && !seen.has(x.id));
    }
    return fail("Admins do not swipe.");
  },

  async swipe(toId: string, dir: 1 | -1): Promise<{ match: Match | null }> {
    await wait(120);
    const u = me();
    if (u.kind === "admin") fail("Admins do not swipe.");
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
        pushNotification(d, { userId: toId, kind: "match", title: `It's a match with ${u.name}`, body: "You both swiped right. Say hello.", link: `#/app/inbox/${match.id}` });
        pushNotification(d, { userId: u.id, kind: "match", title: `It's a match with ${other.name}`, body: "You both swiped right. Say hello.", link: `#/app/inbox/${match.id}` });
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
    return matchesFor(u.id).map((m) => {
      const otherId = u.kind === "talent" ? m.companyId : m.talentId;
      const msgs = d.messages.filter((x) => x.matchId === m.id);
      return { ...m, other: findUser(otherId)!, last: msgs.at(-1) ?? null };
    });
  },

  async messages(id: string): Promise<Message[]> {
    await wait(100);
    const u = me();
    if (!matchesFor(u.id).some((m) => m.id === id)) fail("This conversation is not available.");
    return getDb().messages.filter((m) => m.matchId === id);
  },

  async send(id: string, text: string): Promise<Message> {
    await wait(90);
    const u = me();
    const m = matchesFor(u.id).find((x) => x.id === id) ?? fail("This conversation is not available.");
    if (!text.trim()) fail("Message is empty.");
    const msg: Message = { id: uid("m"), matchId: id, fromId: u.id, text: text.trim(), at: now() };
    mutate((d) => {
      d.messages.push(msg);
      const to = u.id === m.talentId ? m.companyId : m.talentId;
      pushNotification(d, { userId: to, kind: "match", title: `New message from ${u.name}`, body: msg.text.slice(0, 80), link: `#/app/inbox/${id}` });
    });
    return msg;
  },
};

/* ---------- opportunities and applications ---------- */

export type OpportunityWithCompany = Opportunity & { company: CompanyProfile };
export type ApplicationWithTalent = Application & { talent: TalentProfile; opportunity: Opportunity };
export type ApplicationWithOpportunity = Application & { opportunity: OpportunityWithCompany };

function withCompany(o: Opportunity): OpportunityWithCompany {
  return { ...o, company: findUser(o.companyId) as CompanyProfile };
}

const opportunities = {
  /** public list: visible postings from approved companies */
  async list(): Promise<OpportunityWithCompany[]> {
    await wait();
    const d = getDb();
    return d.opportunities
      .filter((o) => !o.hidden && (findUser(o.companyId) as CompanyProfile | undefined)?.status === "approved")
      .sort((a, b) => b.postedAt.localeCompare(a.postedAt))
      .map(withCompany);
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
    if (!input.title.trim()) fail("Give the posting a title.");
    if (!input.cats.length) fail("Pick at least one track.");
    const o: Opportunity = { ...input, id: uid("o"), companyId: c.id, postedAt: now(), hidden: false, hiddenReason: "" };
    mutate((d) => {
      d.opportunities.unshift(o);
    });
    return o;
  },

  async update(id: string, patch: Partial<OpportunityInput>): Promise<void> {
    await wait();
    const c = meCompany();
    const o = getDb().opportunities.find((x) => x.id === id) ?? fail("Posting not found.");
    if (o.companyId !== c.id) fail("You can only edit your own postings.");
    mutate((d) => {
      Object.assign(d.opportunities.find((x) => x.id === id)!, patch);
    });
  },

  async remove(id: string): Promise<void> {
    await wait();
    const c = meCompany();
    const o = getDb().opportunities.find((x) => x.id === id) ?? fail("Posting not found.");
    if (o.companyId !== c.id) fail("You can only remove your own postings.");
    mutate((d) => {
      d.opportunities = d.opportunities.filter((x) => x.id !== id);
      d.applications = d.applications.filter((a) => a.opportunityId !== id);
    });
  },

  async apply(opportunityId: string): Promise<Application> {
    await wait();
    const t = meTalent();
    const d0 = getDb();
    const o = d0.opportunities.find((x) => x.id === opportunityId && !x.hidden) ?? fail("This posting is no longer available.");
    if (d0.applications.some((a) => a.opportunityId === opportunityId && a.talentId === t.id)) fail("You already applied to this.");
    const app: Application = { id: uid("ap"), opportunityId, talentId: t.id, status: "pending", note: "", createdAt: now(), updatedAt: now() };
    mutate((d) => {
      d.applications.push(app);
      pushNotification(d, {
        userId: o.companyId,
        kind: "application",
        title: o.type === "Event" ? "New registration" : "New applicant",
        body: `${t.name} ${o.type === "Event" ? "registered for" : "applied to"} ${o.title}.`,
        link: "#/app/dashboard",
      });
    });
    return app;
  },

  async myApplications(): Promise<ApplicationWithOpportunity[]> {
    await wait();
    const t = meTalent();
    const d = getDb();
    return d.applications
      .filter((a) => a.talentId === t.id)
      .map((a) => ({ ...a, opportunity: withCompany(d.opportunities.find((o) => o.id === a.opportunityId)!) }))
      .filter((a) => a.opportunity && a.opportunity.company)
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
    const app = d0.applications.find((a) => a.id === applicationId) ?? fail("Application not found.");
    const o = d0.opportunities.find((x) => x.id === app.opportunityId)!;
    if (o.companyId !== c.id) fail("This applicant is not on your posting.");
    const label: Record<ApplicationStatus, string> = {
      pending: "moved back to pending",
      shortlisted: "shortlisted you",
      accepted: "accepted you",
      rejected: "decided not to continue",
    };
    mutate((d) => {
      const a = d.applications.find((x) => x.id === applicationId)!;
      a.status = status;
      a.note = note;
      a.updatedAt = now();
      pushNotification(d, {
        userId: a.talentId,
        kind: "application",
        title: status === "accepted" ? "Application accepted" : status === "shortlisted" ? "You're shortlisted" : "Application update",
        body: `${c.name} ${label[status]} for ${o.title}.${note ? ` Note: ${note}` : ""}`,
        link: "#/app/profile",
      });
    });
  },
};

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
    const h: Hackathon = { ...input, id: uid("h"), results: [], createdAt: now(), updatedAt: now() };
    mutate((d) => {
      d.hackathons.push(h);
      pushAudit(d, a, "event.create", h.title, `${h.places.length} places, status ${h.status}`);
    });
    return h;
  },

  async update(id: string, patch: Partial<HackathonInput>): Promise<Hackathon> {
    await wait();
    const a = meAdmin();
    const before = getDb().hackathons.find((h) => h.id === id) ?? fail("Event not found.");
    const next = { ...before, ...patch };
    validateEvent(next);
    mutate((d) => {
      const h = d.hackathons.find((x) => x.id === id)!;
      Object.assign(h, patch, { updatedAt: now() });
      const changed = Object.keys(patch).filter((k) => JSON.stringify((before as never)[k]) !== JSON.stringify((patch as never)[k]));
      pushAudit(d, a, "event.update", h.title, changed.length ? `Changed: ${changed.join(", ")}` : "Saved without changes");
      if (patch.status && patch.status !== before.status) {
        // tell registered team leads about status changes that matter to them
        if (["registration_closed", "in_progress", "cancelled", "finished"].includes(patch.status)) {
          for (const t of d.teams.filter((x) => x.hackathonId === id)) {
            pushNotification(d, {
              userId: t.leadId,
              kind: "event",
              title: `${h.title}: ${statusLabel(patch.status)}`,
              body: patch.status === "cancelled" ? "The organizers cancelled this event." : "Check the event page for details.",
              link: "#/app/hackathons",
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
    const h = getDb().hackathons.find((x) => x.id === id) ?? fail("Event not found.");
    mutate((d) => {
      d.hackathons = d.hackathons.filter((x) => x.id !== id);
      d.teams = d.teams.filter((t) => t.hackathonId !== id);
      pushAudit(d, a, "event.delete", h.title);
    });
  },

  async registerTeam(hackathonId: string, input: TeamInput): Promise<TeamRegistration> {
    await wait();
    const t = meTalent();
    const d0 = getDb();
    const h = d0.hackathons.find((x) => x.id === hackathonId) ?? fail("Event not found.");
    if (h.status !== "registration_open") fail("Registration for this event is not open.");
    const nowLocal = localNow();
    if (h.regOpen && nowLocal < h.regOpen) fail(`Registration opens on ${h.regOpen.replace("T", " at ")}.`);
    if (h.regClose && nowLocal > h.regClose) fail("Registration has closed.");
    const teamsHere = d0.teams.filter((x) => x.hackathonId === hackathonId);
    if (teamsHere.some((x) => x.leadId === t.id)) fail("You already registered a team for this event.");
    if (h.maxTeams && teamsHere.length >= h.maxTeams) fail("This event is full.");
    if (!input.teamName.trim()) fail("Give your team a name.");
    const size = input.members.filter((m) => m.trim()).length;
    if (size === 1 && !h.soloAllowed && h.teamMin > 1) fail(`Teams need at least ${h.teamMin} people. Solo is not allowed here.`);
    if (size > 1 && size < h.teamMin) fail(`Teams need at least ${h.teamMin} people.`);
    if (size > h.teamMax) fail(`Teams can have at most ${h.teamMax} people.`);
    if (input.track && !h.tracks.includes(input.track)) fail("Pick one of the event's tracks.");
    if (h.registrationFields.github && !input.github.trim()) fail("This event asks for a GitHub link.");
    if (h.registrationFields.portfolio && !input.portfolio.trim()) fail("This event asks for a portfolio link.");
    if (h.registrationFields.motivation && !input.motivation.trim()) fail("This event asks why you want to join.");
    if (h.registrationFields.phone && !input.phone.trim()) fail("This event asks for a phone number.");
    const team: TeamRegistration = { ...input, id: uid("tm"), hackathonId, leadId: t.id, createdAt: now() };
    mutate((d) => {
      d.teams.push(team);
      pushNotification(d, {
        userId: t.id,
        kind: "event",
        title: `Registered for ${h.title}`,
        body: `Team ${team.teamName}. The organizers will message the team lead before the event.`,
        link: "#/app/hackathons",
      });
    });
    return team;
  },

  async cancelMyTeam(hackathonId: string): Promise<void> {
    await wait();
    const t = meTalent();
    mutate((d) => {
      d.teams = d.teams.filter((x) => !(x.hackathonId === hackathonId && x.leadId === t.id));
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
    for (const t of getDb().teams) out[t.hackathonId] = (out[t.hackathonId] ?? 0) + 1;
    return out;
  },

  /** assign results and award badges to the team leads */
  async setResults(hackathonId: string, results: Result[]): Promise<void> {
    await wait();
    const a = meAdmin();
    const d0 = getDb();
    const h = d0.hackathons.find((x) => x.id === hackathonId) ?? fail("Event not found.");
    const teamIds = new Set(d0.teams.filter((t) => t.hackathonId === hackathonId).map((t) => t.id));
    for (const r of results) if (!teamIds.has(r.teamId)) fail("A result points to a team that is not registered for this event.");
    mutate((d) => {
      const ev = d.hackathons.find((x) => x.id === hackathonId)!;
      ev.results = results;
      ev.updatedAt = now();
      // drop old badges for this event, then award new ones
      for (const u of d.users) if (u.kind === "talent") u.badges = u.badges.filter((b) => b.hackathonId !== hackathonId);
      for (const r of results) {
        const team = d.teams.find((t) => t.id === r.teamId)!;
        const lead = d.users.find((u) => u.id === team.leadId);
        if (!lead || lead.kind !== "talent") continue;
        const [kind, value] = r.key.split(":");
        const place = kind === "place" ? Number(value) : null;
        const title = kind === "place" ? (h.places.find((p) => p.place === place)?.title ?? `${place} place`) : kind === "nom" ? value : "Finalist";
        const badge: Badge = { id: uid("b"), hackathonId, hackathonName: h.title, place, title, teamName: team.teamName, awardedAt: now() };
        lead.badges.push(badge);
        pushNotification(d, {
          userId: lead.id,
          kind: "badge",
          title: "Badge awarded",
          body: `${title}, ${h.title} was added to your profile.`,
          link: "#/app/profile",
        });
      }
      pushAudit(d, a, "event.results", h.title, `${results.length} results assigned`);
    });
  },
};

export function statusLabel(s: Hackathon["status"]): string {
  return {
    draft: "Draft",
    published: "Published",
    registration_open: "Registration open",
    registration_closed: "Registration closed",
    in_progress: "In progress",
    finished: "Finished",
    cancelled: "Cancelled",
  }[s];
}

function validateEvent(h: HackathonInput) {
  if (!h.title.trim()) fail("Give the event a title.");
  if (!h.start || !h.end) fail("Set the start and end date.");
  if (h.end < h.start) fail("The event ends before it starts.");
  if (h.regOpen && h.regClose && h.regClose < h.regOpen) fail("Registration closes before it opens.");
  if (h.teamMin < 1 || h.teamMax < h.teamMin) fail("Team size: max must be at least min, and min at least 1.");
  if (h.ageMin && h.ageMax && h.ageMax < h.ageMin) fail("Age range is reversed.");
  if (!h.tracks.length) fail("Add at least one track.");
  if (!h.places.length) fail("Add at least one winning place.");
  if (h.places.length > 20) fail("Up to 20 winning places.");
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
    const c = (findUser(companyId) as CompanyProfile | undefined) ?? fail("Company not found.");
    if (status === "rejected" && !note.trim()) fail("Add a short reason so the company knows what to fix.");
    mutate((d) => {
      const x = d.users.find((u) => u.id === companyId) as CompanyProfile;
      x.status = status;
      x.statusNote = note;
      pushNotification(d, {
        userId: companyId,
        kind: "company_status",
        title: status === "approved" ? "Your company is approved" : "Your company was not approved",
        body: status === "approved" ? "You can now swipe talent and publish postings." : `Reason: ${note}`,
        link: "#/app/dashboard",
      });
      pushAudit(d, a, status === "approved" ? "company.approve" : "company.reject", c.name, note);
    });
  },

  async setVerified(userId: string, verified: boolean): Promise<void> {
    await wait();
    const a = meAdmin();
    const u = findUser(userId) ?? fail("User not found.");
    if (u.kind === "admin") fail("Admins are not verified this way.");
    mutate((d) => {
      const x = d.users.find((v) => v.id === userId) as TalentProfile | CompanyProfile;
      x.verified = verified;
      if (verified) {
        pushNotification(d, { userId, kind: "verified", title: "You're verified", body: "A verified mark now shows on your profile and cards.", link: "#/app/profile" });
      }
      pushAudit(d, a, verified ? "user.verify" : "user.unverify", u.name, u.kind);
    });
  },

  async awardBadge(talentId: string, b: { hackathonId: string; place: number | null; title: string; teamName?: string }): Promise<void> {
    await wait();
    const a = meAdmin();
    const t = findUser(talentId);
    if (!t || t.kind !== "talent") fail("Pick a talent account.");
    const h = getDb().hackathons.find((x) => x.id === b.hackathonId) ?? fail("Pick an event.");
    if (!b.title.trim()) fail("Give the badge a title, like 1st place.");
    mutate((d) => {
      const x = d.users.find((v) => v.id === talentId) as TalentProfile;
      x.badges.push({ id: uid("b"), hackathonId: h.id, hackathonName: h.title, place: b.place, title: b.title.trim(), teamName: b.teamName, awardedAt: now() });
      pushNotification(d, { userId: talentId, kind: "badge", title: "Badge awarded", body: `${b.title}, ${h.title} was added to your profile.`, link: "#/app/profile" });
      pushAudit(d, a, "badge.award", t!.name, `${b.title}, ${h.title}`);
    });
  },

  async revokeBadge(talentId: string, badgeId: string): Promise<void> {
    await wait();
    const a = meAdmin("super");
    const t = findUser(talentId) as TalentProfile | undefined;
    const badge = t?.badges.find((b) => b.id === badgeId) ?? fail("Badge not found.");
    mutate((d) => {
      const x = d.users.find((v) => v.id === talentId) as TalentProfile;
      x.badges = x.badges.filter((b) => b.id !== badgeId);
      pushAudit(d, a, "badge.revoke", t!.name, `${badge.title}, ${badge.hackathonName}`);
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
    const o = getDb().opportunities.find((x) => x.id === id) ?? fail("Posting not found.");
    if (hidden && !reason.trim()) fail("Add a reason for hiding it.");
    mutate((d) => {
      const x = d.opportunities.find((v) => v.id === id)!;
      x.hidden = hidden;
      x.hiddenReason = hidden ? reason : "";
      pushNotification(d, {
        userId: o.companyId,
        kind: "system",
        title: hidden ? "Posting hidden by a moderator" : "Posting is visible again",
        body: hidden ? `${o.title}: ${reason}` : o.title,
        link: "#/app/dashboard",
      });
      pushAudit(d, a, hidden ? "opportunity.hide" : "opportunity.restore", o.title, reason);
    });
  },

  async deleteOpportunity(id: string): Promise<void> {
    await wait();
    const a = meAdmin("super");
    const o = getDb().opportunities.find((x) => x.id === id) ?? fail("Posting not found.");
    mutate((d) => {
      d.opportunities = d.opportunities.filter((x) => x.id !== id);
      d.applications = d.applications.filter((x) => x.opportunityId !== id);
      pushAudit(d, a, "opportunity.delete", o.title);
    });
  },

  async deleteUser(userId: string): Promise<void> {
    await wait();
    const a = meAdmin("super");
    if (userId === a.id) fail("You cannot delete your own account.");
    const u = findUser(userId) ?? fail("User not found.");
    mutate((d) => {
      d.users = d.users.filter((x) => x.id !== userId);
      d.creds = d.creds.filter((x) => x.userId !== userId);
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
    if (!input.name.trim()) fail("Enter a name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("Enter a valid email address.");
    if (input.password.length < 8) fail("Password needs at least 8 characters.");
    if (getDb().creds.some((c) => norm(c.email) === email)) fail("This email is already used.");
    const id = uid("a");
    mutate((d) => {
      d.users.push({ kind: "admin", id, email, name: input.name.trim(), level: input.level, createdAt: now() });
      d.creds.push({ email, password: input.password, userId: id });
      pushAudit(d, a, "admin.create", input.name, input.level);
    });
  },

  async setAdminLevel(userId: string, level: AdminLevel): Promise<void> {
    await wait();
    const a = meAdmin("super");
    if (userId === a.id) fail("You cannot change your own role.");
    const u = findUser(userId);
    if (!u || u.kind !== "admin") fail("Not an admin account.");
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
