import { companies as baseCompanies, opportunities as baseOpps, talents as baseTalents } from "../data";
import type {
  AdminProfile,
  Application,
  AuditEntry,
  Badge,
  CompanyProfile,
  Credential,
  DB,
  Hackathon,
  Message,
  Notification,
  Opportunity,
  Swipe,
  TalentProfile,
  TeamRegistration,
} from "./types";

export const SCHEMA = 3;

const DAY = 86400000;
const ago = (days: number, hours = 0) => new Date(Date.now() - days * DAY - hours * 3600000).toISOString();

/* ---------- demo logins (shown on the Login page) ---------- */

export const DEMO_ACCOUNTS = [
  { label: "Talent, hackathon winner", email: "talent.winner@demo.lumora.uz", password: "Demo1234!", userId: "t1", note: "Verified, 1st place badge, matched with NovaSoft" },
  { label: "Talent, verified", email: "talent.verified@demo.lumora.uz", password: "Demo1234!", userId: "t2", note: "Verified, no badge yet" },
  { label: "Talent, new", email: "talent.new@demo.lumora.uz", password: "Demo1234!", userId: "t9", note: "New and unverified" },
  { label: "Company, approved", email: "company.approved@demo.lumora.uz", password: "Demo1234!", userId: "c1", note: "NovaSoft, postings with applicants" },
  { label: "Company, pending", email: "company.pending@demo.lumora.uz", password: "Demo1234!", userId: "c9", note: "Waiting for admin approval" },
  { label: "Organization, partner", email: "org.partner@demo.lumora.uz", password: "Demo1234!", userId: "c7", note: "AI Alliance, runs a partner hackathon" },
  { label: "Super admin", email: "admin@demo.lumora.uz", password: "Admin1234!", userId: "a1", note: "Full access, manages admins" },
  { label: "Moderator", email: "moderator@demo.lumora.uz", password: "Mod1234!", userId: "a2", note: "Reviews and verifies, cannot delete" },
] as const;

/* ---------- past events with results, so badges point somewhere real ---------- */

const pastEvents: { id: string; title: string; city: string; date: string; tracks: string[] }[] = [
  { id: "p1", title: "Andijan IT Case 2026", city: "Andijan", date: "2026-03-14", tracks: ["Frontend", "Backend", "Data & AI", "Game Dev"] },
  { id: "p2", title: "Bukhara IT Case 2026", city: "Bukhara", date: "2026-04-18", tracks: ["UI/UX Design", "Frontend", "Mobile"] },
  { id: "p3", title: "Samarkand IT Case 2026", city: "Samarkand", date: "2026-05-23", tracks: ["Mobile", "Product & Startup"] },
  { id: "p4", title: "Sirdarya IT Case 2026", city: "Guliston", date: "2026-06-20", tracks: ["Backend", "Product & Startup"] },
  { id: "p5", title: "Fergana IT Case 2026", city: "Fergana", date: "2026-09-12", tracks: ["Cybersecurity", "Backend"] },
];

/* talent id -> [event id, place or null, title, team] */
const pastAwards: Record<string, [string, number | null, string, string][]> = {
  t1: [["p1", 1, "1st place", "Ilmhub"]],
  t3: [["p2", 1, "1st place", "Classpilot"]],
  t4: [["p4", 2, "2nd place", "PlacePulse"]],
  t5: [["p3", 1, "1st place", "Capitalist"]],
  t6: [["p5", null, "Finalist", "InvestorOS"]],
  t7: [["p4", 3, "3rd place", "Joyida"]],
  t8: [["p1", 2, "2nd place", "Pathly"]],
};

function badgeFor(talentId: string): Badge[] {
  return (pastAwards[talentId] ?? []).map(([eid, place, title, team], i) => {
    const ev = pastEvents.find((e) => e.id === eid)!;
    return { id: `b-${talentId}-${i}`, hackathonId: eid, hackathonName: ev.title, place, title, teamName: team, awardedAt: `${ev.date}T18:00:00.000Z` };
  });
}

const contacts: Record<string, string> = {
  t1: "@dilnoza_dev",
  t2: "@jasur_ai",
  t3: "@madina_ux",
  t4: "@sardor_backend",
  t5: "@nilufar_mobile",
  t6: "@bekzod_sec",
  t7: "@aziza_pm",
  t8: "@timur_gd",
};

function talents(): TalentProfile[] {
  const list: TalentProfile[] = baseTalents.map((t, i) => ({
    kind: "talent",
    id: t.id,
    email: `${t.name.split(" ")[0].toLowerCase()}@example.uz`,
    name: t.name,
    cat: t.cat,
    city: t.city,
    age: t.age,
    bio: t.bio,
    skills: t.skills,
    project: t.project,
    avail: t.avail,
    contact: contacts[t.id] ?? "",
    portfolio: `github.com/${t.name.split(" ")[0].toLowerCase()}`,
    verified: t.id !== "t6",
    badges: badgeFor(t.id),
    createdAt: ago(200 - i * 10),
  }));
  // demo accounts take over t1 and t2
  list[0].email = "talent.winner@demo.lumora.uz";
  list[1].email = "talent.verified@demo.lumora.uz";
  list.push({
    kind: "talent",
    id: "t9",
    email: "talent.new@demo.lumora.uz",
    name: "Kamola Ergasheva",
    cat: "Backend",
    city: "Namangan",
    age: 18,
    bio: "First-year CS student. Built a Telegram bot for my university schedule and want a first internship.",
    skills: ["Python", "FastAPI", "SQL"],
    project: "TATU schedule bot",
    avail: "Part-time",
    contact: "@kamola_dev",
    portfolio: "github.com/kamola-e",
    verified: false,
    badges: [],
    createdAt: ago(2),
  });
  return list;
}

function companies(): CompanyProfile[] {
  const list: CompanyProfile[] = baseCompanies.map((c, i) => ({
    kind: "company",
    id: c.id,
    email: `hr@${c.name.toLowerCase().replace(/[^a-z]/g, "")}.uz`,
    name: c.name,
    orgKind: c.id === "c7" || c.id === "c8" ? "organization" : "company",
    tagline: c.tagline,
    industry: c.industry,
    city: c.city,
    size: c.size,
    about: c.about,
    tags: c.tags,
    website: `${c.name.toLowerCase().replace(/[^a-z]/g, "")}.uz`,
    contact: `hr@${c.name.toLowerCase().replace(/[^a-z]/g, "")}.uz`,
    status: "approved",
    statusNote: "",
    verified: ["c1", "c2", "c4", "c7"].includes(c.id),
    partner: c.id === "c7",
    hue: c.hue,
    createdAt: ago(300 - i * 20),
  }));
  list.find((c) => c.id === "c1")!.email = "company.approved@demo.lumora.uz";
  list.find((c) => c.id === "c7")!.email = "org.partner@demo.lumora.uz";
  list.push({
    kind: "company",
    id: "c9",
    email: "company.pending@demo.lumora.uz",
    name: "Silk Road Labs",
    orgKind: "company",
    tagline: "Logistics software for Central Asian freight",
    industry: "Logistics",
    city: "Tashkent",
    size: "25 people",
    about: "We build route planning and tracking tools for freight companies. Looking for backend and mobile interns.",
    tags: ["Go", "Flutter", "Maps"],
    website: "silkroadlabs.uz",
    contact: "jobs@silkroadlabs.uz",
    status: "pending",
    statusNote: "",
    verified: false,
    partner: false,
    hue: "#2552c4",
    createdAt: ago(1),
  });
  return list;
}

function admins(): AdminProfile[] {
  return [
    { kind: "admin", id: "a1", email: "admin@demo.lumora.uz", name: "Lumora Admin", level: "super", createdAt: ago(400) },
    { kind: "admin", id: "a2", email: "moderator@demo.lumora.uz", name: "Lumora Moderator", level: "moderator", createdAt: ago(120) },
  ];
}

function opportunities(): Opportunity[] {
  const daysAgo: Record<string, number> = { o1: 2, o2: 4, o3: 7, o4: 3, o5: 5, o6: 1, o7: 7, o8: 2, o9: 6 };
  const list: Opportunity[] = baseOpps.map((o) => ({
    id: o.id,
    companyId: o.companyId,
    title: o.title,
    type: o.type,
    cats: o.cats,
    city: o.city,
    dur: o.dur,
    pay: o.pay,
    desc: o.desc,
    req: o.req,
    postedAt: ago(daysAgo[o.id] ?? 3),
    hidden: false,
    hiddenReason: "",
  }));
  list.push({
    id: "o10",
    companyId: "c1",
    title: "QA intern",
    type: "Internship",
    cats: ["Frontend", "Backend"],
    city: "Tashkent, hybrid",
    dur: "8 weeks from 1 Dec 2026",
    pay: "1,500,000 UZS per month",
    desc: "Write test plans and automated tests for the school management app with the QA lead.",
    req: ["Attention to detail", "Basic JavaScript or Python"],
    postedAt: ago(1),
    hidden: false,
    hiddenReason: "",
  });
  list.push({
    id: "o11",
    companyId: "c6",
    title: "Crypto trading bot developer",
    type: "Position",
    cats: ["Backend"],
    city: "Remote",
    dur: "Ongoing",
    pay: "Commission only",
    desc: "Unclear posting reported by two users. Hidden by a moderator pending review.",
    req: ["Python"],
    postedAt: ago(9),
    hidden: true,
    hiddenReason: "Reported as unclear pay terms",
  });
  return list;
}

function applications(): Application[] {
  const a = (id: string, opp: string, t: string, status: Application["status"], d: number): Application => ({
    id,
    opportunityId: opp,
    talentId: t,
    status,
    note: "",
    createdAt: ago(d),
    updatedAt: ago(d - 0.5 > 0 ? d - 0.5 : 0),
  });
  return [
    a("ap1", "o1", "t1", "shortlisted", 2),
    a("ap2", "o1", "t2", "pending", 1),
    a("ap3", "o1", "t3", "pending", 1),
    a("ap4", "o10", "t4", "pending", 1),
    a("ap5", "o2", "t2", "pending", 3),
    a("ap6", "o9", "t2", "accepted", 5),
  ];
}

function swipes(): Swipe[] {
  const s = (fromId: string, toId: string, dir: 1 | -1, d = 1): Swipe => ({ fromId, toId, dir, at: ago(d) });
  return [
    // Dilnoza and NovaSoft already matched
    s("t1", "c1", 1, 3),
    s("c1", "t1", 1, 2),
    // Jasur liked NovaSoft: NovaSoft swiping right on Jasur makes a match
    s("t2", "c1", 1, 2),
    // companies that already like the demo talents: talents swiping right on them makes a match
    s("c2", "t1", 1, 1),
    s("c2", "t2", 1, 1),
    s("c2", "t9", 1, 1),
    s("c4", "t1", 1, 1),
    s("c4", "t2", 1, 1),
    s("c3", "t9", 1, 1),
    s("c7", "t2", 1, 1),
    // AI Alliance and Jasur matched
    s("t2", "c7", 1, 4),
  ];
}

function messages(): Message[] {
  const m = (id: string, matchId: string, fromId: string, text: string, d: number, h: number): Message => ({ id, matchId, fromId, text, at: ago(d, h) });
  return [
    m("m1", "t1__c1", "c1", "Hi Dilnoza! We loved Ilmhub. Do you have time for a short call this week about the frontend internship?", 2, 5),
    m("m2", "t1__c1", "t1", "Hi! Thank you, yes. Thursday after 16:00 works for me.", 2, 3),
    m("m3", "t1__c1", "c1", "Great, Thursday 17:00 then. We will send a Google Meet link.", 2, 1),
    m("m4", "t2__c7", "c7", "Jasur, we saw your LevelUp model. Would you like to mentor at AI Weekend?", 3, 2),
  ];
}

function notifications(): Notification[] {
  const n = (id: string, userId: string, kind: Notification["kind"], title: string, body: string, link: string, read: boolean, d: number): Notification => ({
    id,
    userId,
    kind,
    title,
    body,
    link,
    read,
    at: ago(d),
  });
  return [
    n("n1", "t1", "application", "You're shortlisted", "NovaSoft shortlisted you for Frontend intern (React).", "#/app/profile", false, 1),
    n("n2", "t1", "match", "It's a match with NovaSoft", "You and NovaSoft swiped right on each other.", "#/app/inbox", true, 2),
    n("n3", "t1", "badge", "Badge awarded", "1st place, Andijan IT Case 2026 was added to your profile.", "#/app/profile", true, 200),
    n("n4", "t2", "application", "Application accepted", "AI Alliance accepted you for ML intern.", "#/app/profile", false, 4),
    n("n5", "t9", "system", "Welcome to Lumora Connect", "Complete your profile and join a hackathon to get verified.", "#/app/profile", false, 2),
    n("n6", "c1", "application", "New applicant", "Jasur Rahimov applied to Frontend intern (React).", "#/app/dashboard", false, 1),
    n("n7", "c1", "application", "New applicant", "Sardor Tursunov applied to QA intern.", "#/app/dashboard", false, 1),
    n("n8", "c9", "company_status", "Waiting for approval", "A Lumora admin will review Silk Road Labs shortly. You can prepare postings meanwhile.", "#/app/dashboard", false, 1),
  ];
}

/* ---------- events ---------- */

const baseEvent = {
  caseBrief: "",
  accent: "blue" as const,
  address: "",
  onlineLink: "",
  timezone: "Asia/Tashkent",
  soloAllowed: false,
  ageMin: 14,
  ageMax: 25,
  eligibility: "Students and young developers from Uzbekistan.",
  languages: ["Uzbek", "Russian", "English"],
  nominations: [] as string[],
  finalists: 0,
  judges: [],
  mentors: [],
  sponsors: [],
  agenda: [],
  registrationFields: { github: true, portfolio: false, motivation: false, phone: false },
  results: [],
};

function hackathons(): Hackathon[] {
  const live: Hackathon[] = [
    {
      ...baseEvent,
      id: "h1",
      title: "Tashkent IT Case Competition",
      organizerId: "lumora",
      organizerName: "Lumora",
      eventType: "case",
      short: "Flagship case competition with a partner company case. Pitch to a jury of founders and CTOs.",
      description:
        "Teams get a real case from a partner company at 10:00 and pitch a working prototype at 18:00. The jury picks three winners and two special nominations. Every finalist gets an interview slot with a partner.",
      caseBrief: "Design a tool that helps school teachers in the regions track student progress offline.",
      accent: "blue",
      city: "Tashkent",
      venue: "IT Park Tashkent, hall B",
      address: "Mirzo Ulugbek district, Tashkent",
      mode: "offline",
      start: "2026-12-20T10:00",
      end: "2026-12-20T19:00",
      regOpen: "2026-11-01T09:00",
      regClose: "2026-12-17T23:59",
      tracks: ["Frontend", "Backend", "Mobile", "Data & AI", "UI/UX Design", "Product & Startup"],
      teamMin: 3,
      teamMax: 6,
      maxTeams: 40,
      places: [
        { place: 1, title: "1st place", prize: "2,000,000 UZS and internship interviews" },
        { place: 2, title: "2nd place", prize: "1,200,000 UZS" },
        { place: 3, title: "3rd place", prize: "800,000 UZS" },
      ],
      nominations: ["Best design", "Best pitch"],
      finalists: 6,
      judges: [
        { name: "Aziz Karimov", role: "CTO", company: "NovaSoft" },
        { name: "Nodira Saidova", role: "Head of Data", company: "Zamin Analytics" },
      ],
      mentors: [{ name: "Rustam Aliev", role: "Senior engineer", company: "SafeNet UZ" }],
      sponsors: ["NovaSoft", "Zamin Analytics", "IT Park"],
      agenda: [
        { time: "09:30", title: "Check-in and coffee" },
        { time: "10:00", title: "Case reveal" },
        { time: "13:00", title: "Lunch and mentor round" },
        { time: "17:00", title: "Code freeze" },
        { time: "17:15", title: "Pitches" },
        { time: "18:45", title: "Results" },
      ],
      status: "registration_open",
      registrationFields: { github: true, portfolio: false, motivation: true, phone: true },
      createdAt: ago(30),
      updatedAt: ago(3),
    },
    {
      ...baseEvent,
      id: "h2",
      title: "Namangan IT Case",
      organizerId: "lumora",
      organizerName: "Lumora",
      eventType: "case",
      short: "First Lumora round in Namangan. Regional case from a local logistics company.",
      description: "A one-day case competition for students from Namangan and the Fergana valley.",
      accent: "sky",
      city: "Namangan",
      venue: "Namangan State University, IT center",
      address: "Namangan",
      mode: "offline",
      start: "2027-01-24T10:00",
      end: "2027-01-24T18:00",
      regOpen: "2026-12-01T09:00",
      regClose: "2027-01-20T23:59",
      tracks: ["Frontend", "Backend", "Mobile", "Product & Startup"],
      teamMin: 3,
      teamMax: 5,
      maxTeams: 24,
      places: [
        { place: 1, title: "1st place", prize: "1,500,000 UZS" },
        { place: 2, title: "2nd place", prize: "1,000,000 UZS" },
        { place: 3, title: "3rd place", prize: "500,000 UZS" },
      ],
      status: "registration_open",
      createdAt: ago(20),
      updatedAt: ago(5),
    },
    {
      ...baseEvent,
      id: "h3",
      title: "AI Weekend",
      organizerId: "c7",
      organizerName: "AI Alliance",
      eventType: "hackathon",
      short: "Partner hackathon. Build an LLM app in 36 hours with mentors from the accelerator.",
      description: "A two-day hackathon run by AI Alliance. Winners get a fast track into the accelerator.",
      accent: "yellow",
      city: "Tashkent",
      venue: "AI Alliance hub",
      address: "Yunusabad, Tashkent",
      mode: "hybrid",
      onlineLink: "meet.example.com/ai-weekend",
      start: "2027-02-13T09:00",
      end: "2027-02-14T18:00",
      regOpen: "2026-11-15T09:00",
      regClose: "2027-02-10T23:59",
      tracks: ["Data & AI", "Product & Startup"],
      teamMin: 2,
      teamMax: 4,
      soloAllowed: true,
      maxTeams: 30,
      places: [
        { place: 1, title: "1st place", prize: "Accelerator fast track" },
        { place: 2, title: "2nd place", prize: "Cloud credits" },
      ],
      nominations: ["Best use of open models"],
      sponsors: ["AI Alliance"],
      status: "registration_open",
      registrationFields: { github: true, portfolio: true, motivation: true, phone: false },
      createdAt: ago(10),
      updatedAt: ago(2),
    },
    {
      ...baseEvent,
      id: "h4",
      title: "Lumora Online Sprint",
      organizerId: "lumora",
      organizerName: "Lumora",
      eventType: "hackathon",
      short: "Remote sprint for participants outside the big cities.",
      description: "48 hours, fully online. Teams submit a repository and a 3-minute video.",
      accent: "navy",
      city: "Online",
      venue: "",
      mode: "online",
      onlineLink: "lumora.uz/sprint",
      start: "2027-03-06T12:00",
      end: "2027-03-08T12:00",
      regOpen: "2027-01-15T09:00",
      regClose: "2027-03-03T23:59",
      tracks: ["Frontend", "Backend", "Mobile", "Data & AI", "Game Dev"],
      teamMin: 1,
      teamMax: 2,
      soloAllowed: true,
      maxTeams: 100,
      places: [
        { place: 1, title: "1st place", prize: "Internship interviews with partners" },
        { place: 2, title: "2nd place", prize: "Internship interviews with partners" },
        { place: 3, title: "3rd place", prize: "Merch and certificates" },
        { place: 4, title: "4th place", prize: "Certificates" },
        { place: 5, title: "5th place", prize: "Certificates" },
      ],
      status: "published",
      createdAt: ago(8),
      updatedAt: ago(8),
    },
    {
      ...baseEvent,
      id: "h5",
      title: "Bukhara Spring Case 2027",
      organizerId: "lumora",
      organizerName: "Lumora",
      eventType: "case",
      short: "Draft. Tourism-tech case with the regional hokimiyat.",
      description: "Still being planned with the partner.",
      accent: "blue",
      city: "Bukhara",
      venue: "TBD",
      mode: "offline",
      start: "2027-04-17T10:00",
      end: "2027-04-17T18:00",
      regOpen: "2027-03-01T09:00",
      regClose: "2027-04-12T23:59",
      tracks: ["UI/UX Design", "Frontend", "Product & Startup"],
      teamMin: 3,
      teamMax: 5,
      maxTeams: 20,
      places: [
        { place: 1, title: "1st place", prize: "TBD" },
        { place: 2, title: "2nd place", prize: "TBD" },
        { place: 3, title: "3rd place", prize: "TBD" },
      ],
      status: "draft",
      createdAt: ago(1),
      updatedAt: ago(1),
    },
  ];

  const past: Hackathon[] = pastEvents.map((e) => ({
    ...baseEvent,
    id: e.id,
    title: e.title,
    organizerId: "lumora",
    organizerName: "Lumora",
    eventType: "case",
    short: `Lumora IT case competition in ${e.city}.`,
    description: `One-day case competition in ${e.city}.`,
    accent: "blue",
    city: e.city,
    venue: "",
    mode: "offline",
    start: `${e.date}T10:00`,
    end: `${e.date}T18:00`,
    regOpen: `${e.date}T00:00`,
    regClose: `${e.date}T00:00`,
    tracks: e.tracks,
    teamMin: 3,
    teamMax: 6,
    maxTeams: 30,
    places: [
      { place: 1, title: "1st place", prize: "1,500,000 UZS" },
      { place: 2, title: "2nd place", prize: "1,000,000 UZS" },
      { place: 3, title: "3rd place", prize: "500,000 UZS" },
    ],
    finalists: e.id === "p5" ? 4 : 0,
    status: "finished",
    results: [],
    createdAt: `${e.date}T00:00:00.000Z`,
    updatedAt: `${e.date}T18:00:00.000Z`,
  }));
  return [...live, ...past];
}

function teams(events: Hackathon[]): TeamRegistration[] {
  const t = (id: string, hackathonId: string, teamName: string, leadId: string, members: string[], track: string): TeamRegistration => ({
    id,
    hackathonId,
    teamName,
    leadId,
    members,
    track,
    contact: contacts[leadId] ?? "",
    github: "",
    portfolio: "",
    motivation: "",
    phone: "",
    createdAt: ago(3),
  });
  const list: TeamRegistration[] = [
    t("tm1", "h1", "Night Owls", "t1", ["Dilnoza Karimova", "Aziz T.", "Lola M."], "Frontend"),
    t("tm2", "h1", "Data Wizards", "t2", ["Jasur Rahimov", "Akmal R.", "Zarina K."], "Data & AI"),
    t("tm3", "h1", "Pixel Push", "t3", ["Madina Yusupova", "Saida N.", "Ulugbek F."], "UI/UX Design"),
    t("tm4", "h3", "Prompt Engineers", "t2", ["Jasur Rahimov"], "Data & AI"),
  ];
  // past events: one team per award so results resolve to real teams
  for (const [talentId, awards] of Object.entries(pastAwards)) {
    awards.forEach(([eid, place, title, team], i) => {
      const id = `tm-${eid}-${talentId}-${i}`;
      list.push(t(id, eid, team, talentId, [], events.find((e) => e.id === eid)!.tracks[0]));
      const ev = events.find((e) => e.id === eid)!;
      ev.results.push({ key: place ? `place:${place}` : title === "Finalist" ? `finalist:${ev.results.length + 1}` : `nom:${title}`, teamId: id });
    });
  }
  return list;
}

function audit(): AuditEntry[] {
  const a = (id: string, actorId: string, actorName: string, action: string, target: string, detail: string, d: number): AuditEntry => ({
    id,
    actorId,
    actorName,
    action,
    target,
    detail,
    at: ago(d),
  });
  return [
    a("au1", "a1", "Lumora Admin", "event.create", "Tashkent IT Case Competition", "Created with 3 places and 2 nominations", 30),
    a("au2", "a2", "Lumora Moderator", "user.verify", "Madina Yusupova", "Verified talent", 12),
    a("au3", "a2", "Lumora Moderator", "opportunity.hide", "Crypto trading bot developer", "Reported as unclear pay terms", 9),
    a("au4", "a1", "Lumora Admin", "event.update", "AI Weekend", "Registration opened", 2),
  ];
}

export function seed(): DB {
  const users = [...talents(), ...companies(), ...admins()];
  const creds: Credential[] = DEMO_ACCOUNTS.map((d) => ({ email: d.email, password: d.password, userId: d.userId }));
  const events = hackathons();
  return {
    schema: SCHEMA,
    version: 1,
    users,
    creds,
    opportunities: opportunities(),
    applications: applications(),
    swipes: swipes(),
    messages: messages(),
    notifications: notifications(),
    hackathons: events,
    teams: teams(events),
    audit: audit(),
  };
}
