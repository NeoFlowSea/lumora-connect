import { categories } from "../data";
import { lumora } from "../content/lumora";
import { hashPassword } from "./crypto";
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
  OpportunityLevel,
  OpportunityType,
  Schedule,
  Swipe,
  TalentProfile,
  TeamRegistration,
  Verification,
  WorkFormat,
} from "./types";

/* Seed data for the browser preview.
   - Past Lumora rounds are real (src/content/lumora.ts).
   - People, companies, postings and upcoming events are samples and carry demo: true,
     which the interface shows as a "Demo profile" / "Sample" tag.
   - Demo badges come from a separate sample event, never from real rounds. */

export const SCHEMA = 5;

const DAY = 86400000;
const ago = (days: number, hours = 0) => new Date(Date.now() - days * DAY - hours * 3600000).toISOString();
const ahead = (days: number, time = "10:00") => {
  const d = new Date(Date.now() + days * DAY);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${time}`;
};

/* deterministic pseudo-random so the seed is the same in every browser */
let rs = 20261121;
const rnd = () => ((rs = (rs * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const pick = <T,>(a: readonly T[]) => a[Math.floor(rnd() * a.length)];
const pickN = <T,>(a: readonly T[], n: number) => {
  const c = [...a];
  const out: T[] = [];
  while (out.length < n && c.length) out.push(c.splice(Math.floor(rnd() * c.length), 1)[0]);
  return out;
};

/* ---------- logins (listed in README only, never on the site) ---------- */

export const DEMO_ACCOUNTS = [
  { label: "Talent, hackathon winner", email: "talent.winner@demo.lumora.uz", password: "Demo1234!", userId: "t1", note: "Verified, 1st place badge (sample Demo Cup), matched with NovaSoft" },
  { label: "Talent, verified", email: "talent.verified@demo.lumora.uz", password: "Demo1234!", userId: "t2", note: "Verified by university email, no badge" },
  { label: "Talent, new (sees onboarding)", email: "talent.new@demo.lumora.uz", password: "Demo1234!", userId: "t9", note: "New and unverified, sees the onboarding" },
  { label: "Company, approved", email: "company.approved@demo.lumora.uz", password: "Demo1234!", userId: "c1", note: "NovaSoft, postings with applicants" },
  { label: "Company, pending", email: "company.pending@demo.lumora.uz", password: "Demo1234!", userId: "c9", note: "Silk Road Labs, waiting for admin approval" },
  { label: "Organization, partner", email: "org.partner@demo.lumora.uz", password: "Demo1234!", userId: "c7", note: "Kelajak Tech Community, runs a partner hackathon" },
  { label: "Super admin", email: "admin@demo.lumora.uz", password: "Admin1234!", userId: "a1", note: "Full access, manages admins" },
  { label: "Moderator", email: "moderator@demo.lumora.uz", password: "Mod1234!", userId: "a2", note: "Reviews and verifies, cannot delete" },
] as const;

const verified = (proof: Verification["proof"], value: string, d = 60): Verification => ({
  level: "verified",
  proof,
  proofValue: value,
  requestedAt: ago(d + 2),
  reviewedAt: ago(d),
  note: "",
});
const unverified = (): Verification => ({ level: "unverified", proof: "", proofValue: "", requestedAt: "", reviewedAt: "", note: "" });
const pendingV = (proof: Verification["proof"], value: string): Verification => ({ level: "pending", proof, proofValue: value, requestedAt: ago(1), reviewedAt: "", note: "" });

/* ---------- sample event that gives demo people their badges ---------- */

const DEMO_CUP = { id: "demo-cup", title: "Lumora Demo Cup 2026", date: "2026-06-14" };

/* ---------- talents ---------- */

const first = ["Dilnoza", "Jasur", "Madina", "Sardor", "Nilufar", "Bekzod", "Aziza", "Timur", "Kamola", "Javohir", "Shahzoda", "Otabek", "Malika", "Islom", "Gulnoza", "Abdulla", "Sevara", "Bobur", "Zarina", "Doniyor", "Mohinur", "Ulug'bek", "Nodira", "Sherzod", "Feruza", "Akmal", "Lola", "Rustam", "Dildora", "Asadbek", "Munisa", "Behruz", "Saida", "Elyor", "Zuhra", "Mirjalol", "Laylo", "Shoxrux", "Charos", "Azamat"];
const last = ["Karimova", "Rahimov", "Yusupova", "Tursunov", "Azimova", "Islomov", "Nurmatova", "Abdullaev", "Ergasheva", "Qodirov", "Rakhimova", "Nazarov", "Saidova", "Hasanov", "Mirzaeva", "Aliev", "Usmonova", "Sobirov", "Xolmatova", "Ismoilov", "Jo'raeva", "Rasulov", "Toshpo'latova", "Ortiqov", "Normatova", "Sharipov", "Valieva", "Mamatov", "Ahmedova", "Yo'ldoshev", "Raximova", "Ibragimov", "Qosimova", "Davronov", "Fayzieva", "Murodov", "Xasanova", "Boboev", "Eshonqulova", "Saidov"];
const cities = ["Tashkent", "Tashkent", "Tashkent", "Samarkand", "Fergana", "Andijan", "Namangan", "Bukhara", "Nukus", "Guliston", "Jizzakh", "Karshi"];
const institutions: [string, TalentProfile["education"]["level"]][] = [
  ["Tashkent University of Information Technologies", "university"],
  ["Westminster International University in Tashkent", "university"],
  ["Inha University in Tashkent", "university"],
  ["Turin Polytechnic University in Tashkent", "university"],
  ["Samarkand State University", "university"],
  ["Fergana State University", "university"],
  ["Presidential School", "school"],
  ["Specialized IT school", "school"],
  ["Academic lyceum", "lyceum"],
  ["School 21", "course"],
  ["Najot Ta'lim", "course"],
];
const programs = ["Computer Science", "Software Engineering", "Information Systems", "Applied Mathematics", "Business Informatics", "Digital Design", "Data Science"];
const skillsBy: Record<string, string[]> = {
  Frontend: ["React", "TypeScript", "Tailwind", "Next.js", "Figma", "Vue"],
  Backend: ["Node.js", "Python", "FastAPI", "PostgreSQL", "Go", "Docker", "Django"],
  Mobile: ["Flutter", "Dart", "Firebase", "Kotlin", "Swift", "React Native"],
  "Data & AI": ["Python", "Pandas", "SQL", "scikit-learn", "LLM apps", "Power BI"],
  "UI/UX Design": ["Figma", "Prototyping", "User research", "Design systems", "Framer"],
  Cybersecurity: ["Linux", "Burp Suite", "Networking", "CTF", "Python"],
  "Game Dev": ["Unity", "C#", "Blender", "Godot"],
  "Robotics & IoT": ["Arduino", "C++", "Raspberry Pi", "Embedded C"],
  "Product & Startup": ["Pitching", "Notion", "Market research", "No-code", "Figma"],
};
const projectIdeas: Record<string, [string, string][]> = {
  Frontend: [["Ilmhub", "Learning app for regional schools"], ["Bozor Map", "Map of farmers' markets with live prices"]],
  Backend: [["PlacePulse API", "Review service backed by receipts"], ["Navbat", "Queue booking API for clinics"]],
  Mobile: [["Yo'l", "Bus arrival app for Samarkand"], ["Kitob", "Book swap app for students"]],
  "Data & AI": [["LevelUp", "Finds weak topics from test results"], ["Narx", "Price forecasting for a grocery chain"]],
  "UI/UX Design": [["Classpilot screens", "Teacher assistant design"], ["Hokimiyat forms", "Redesign of public service forms"]],
  Cybersecurity: [["Phish Watch", "Browser extension that flags phishing links"], ["CTF writeups", "Solutions to national CTF tasks"]],
  "Game Dev": [["Pathly", "Gamified study planner"], ["Registon Run", "Endless runner set in Samarkand"]],
  "Robotics & IoT": [["Greenhouse bot", "Soil moisture and watering controller"], ["Smart bin", "Waste level sensor network"]],
  "Product & Startup": [["Joyida", "Trust score for local services"], ["Mentor Match", "Connects students with mentors"]],
};
const langs = ["Uzbek", "Russian", "English"];
const avails = ["Part-time", "Full-time (summer)", "Weekends", "Remote only"];
const roleBy: Record<string, string[]> = {
  Frontend: ["Frontend intern", "Junior frontend developer"],
  Backend: ["Backend intern", "Junior backend developer"],
  Mobile: ["Mobile developer intern", "Junior Flutter developer"],
  "Data & AI": ["Data analyst intern", "ML intern"],
  "UI/UX Design": ["Product design intern", "UI designer"],
  Cybersecurity: ["Security analyst intern"],
  "Game Dev": ["Junior game developer"],
  "Robotics & IoT": ["Embedded intern", "Robotics mentor"],
  "Product & Startup": ["Product intern", "Startup analyst"],
};

function talentAt(i: number): TalentProfile {
  const id = `t${i + 1}`;
  const name = `${first[i]} ${last[i]}`;
  const cat = categories[i % categories.length].name;
  const city = cities[i % cities.length];
  const [inst, level] = institutions[i % institutions.length];
  const skills = pickN(skillsBy[cat], 3 + (i % 2));
  const [pName, pDesc] = projectIdeas[cat][i % 2];
  const isVerified = i % 5 !== 3; // most are verified
  const handle = first[i].toLowerCase().replace(/[^a-z]/g, "");
  return {
    kind: "talent",
    id,
    email: `${handle}.${i + 1}@example.uz`,
    name,
    cat,
    city,
    age: 16 + (i % 7),
    bio: `${cat} ${level === "university" ? "student" : "learner"} from ${city}. Built ${pName}: ${pDesc.toLowerCase()}. Looking for a first ${roleBy[cat][0].toLowerCase()} role.`,
    skills,
    project: pName,
    avail: avails[i % avails.length],
    contact: `@${handle}_${cat.split(" ")[0].toLowerCase().replace(/[^a-z]/g, "")}`,
    portfolio: `github.com/${handle}${i + 1}`,
    verified: isVerified,
    badges: [],
    createdAt: ago(240 - i * 5),
    photo: "",
    headline: `${roleBy[cat][0]} · ${city}`.replace(" · ", ", "),
    region: city,
    education: { institution: inst, level, program: level === "university" ? pick(programs) : "", year: level === "university" ? `${1 + (i % 4)} year` : `${9 + (i % 3)} grade` },
    languages: i % 3 === 0 ? langs : pickN(langs, 2),
    experience:
      i % 3 === 0
        ? [{ id: `x${i}`, title: `${cat} volunteer`, org: pick(["IT Park residents program", "University tech club", "Local NGO"]), period: "2025 to 2026", desc: "Built and maintained small tools for the team." }]
        : [],
    projects: [{ id: `p${i}`, name: pName, url: `github.com/${handle}${i + 1}/${pName.toLowerCase().replace(/[^a-z]/g, "-")}`, role: "Team lead", desc: pDesc, event: "" }],
    cv: null,
    roles: roleBy[cat],
    workFormats: i % 2 ? ["remote", "hybrid"] : ["onsite", "hybrid"],
    expectedStipend: i % 4 === 0 ? "Unpaid is fine for the right mentor" : `${(2 + (i % 4)) * 1000000} UZS per month`.replace(/\B(?=(\d{3})+(?!\d))/g, ","),
    github: `github.com/${handle}${i + 1}`,
    linkedin: "",
    verification: isVerified ? verified("event", DEMO_CUP.title, 90 - i) : i === 13 ? pendingV("github", `github.com/${handle}${i + 1}`) : unverified(),
    onboarded: true,
    emailConfirmed: true,
    consentAt: ago(240 - i * 5),
    demo: true,
  };
}

function talents(): TalentProfile[] {
  const list = Array.from({ length: 40 }, (_, i) => talentAt(i));
  // demo logins take over three people
  const winner = list[0];
  winner.email = "talent.winner@demo.lumora.uz";
  winner.headline = "Frontend developer, Andijan";
  winner.bio = "I build interfaces fast and care about how they feel. Won the Demo Cup with Ilmhub, a learning app for regional schools. Looking for a frontend internship.";
  winner.experience = [{ id: "x-w1", title: "Frontend volunteer", org: "Andijan tech club", period: "2025 to 2026", desc: "Built the club's event site and a quiz app used by 300 students." }];
  winner.projects = [
    { id: "p-w1", name: "Ilmhub", url: "github.com/dilnoza1/ilmhub", role: "Team lead, frontend", desc: "Learning app for regional schools, built in one day at the Demo Cup.", event: DEMO_CUP.title },
    { id: "p-w2", name: "Quiz Club", url: "github.com/dilnoza1/quiz-club", role: "Solo", desc: "Live quiz app for school events.", event: "" },
  ];
  const ver = list[1];
  ver.email = "talent.verified@demo.lumora.uz";
  ver.cat = "Data & AI";
  ver.skills = ["Python", "Pandas", "SQL", "LLM apps"];
  ver.verification = verified("university_email", "j.rahimov@tuit.uz", 30);
  const fresh = list[8];
  fresh.email = "talent.new@demo.lumora.uz";
  fresh.verified = false;
  fresh.verification = unverified();
  fresh.onboarded = false;
  fresh.bio = "";
  fresh.headline = "";
  fresh.education = { institution: "", level: "", program: "", year: "" };
  fresh.languages = [];
  fresh.experience = [];
  fresh.projects = [];
  fresh.roles = [];
  fresh.skills = [];
  fresh.project = "";
  fresh.github = "";
  fresh.portfolio = "";
  fresh.expectedStipend = "";
  fresh.createdAt = ago(0, 2);
  return list;
}

/* demo badges: podium and finalists of the sample Demo Cup */
const demoAwards: [string, number | null, string, string][] = [
  ["t1", 1, "1st place", "Ilmhub"],
  ["t4", 2, "2nd place", "PlacePulse"],
  ["t3", 3, "3rd place", "Classpilot"],
  ["t5", null, "Finalist", "Yo'l"],
  ["t6", null, "Finalist", "Phish Watch"],
  ["t12", null, "Best design", "Hokimiyat forms"],
];

/* ---------- companies (all fictional samples) ---------- */

type C = [id: string, name: string, kind: CompanyProfile["orgKind"], industry: string, city: string, size: string, tagline: string, tags: string[], hue: string];
const companyRows: C[] = [
  ["c1", "NovaSoft", "company", "EdTech", "Tashkent", "80 people", "School management software used by 400 schools", ["React", "TypeScript", "Hybrid"], "#1a4ba8"],
  ["c2", "Zamin Analytics", "company", "Data", "Tashkent", "35 people", "Retail data for supermarket chains", ["Python", "SQL", "Remote"], "#2563c9"],
  ["c3", "Orbit Mobile", "company", "Logistics", "Samarkand", "20 people", "Delivery app with 5,000 daily customers", ["Flutter", "Firebase"], "#4f8be0"],
  ["c4", "SafeNet UZ", "company", "Security", "Tashkent", "50 people", "Application security for banks and fintech", ["Linux", "AppSec"], "#123a86"],
  ["c5", "Pixel Studio", "company", "Design", "Bukhara", "12 people", "Product design studio for edtech and fintech", ["Figma", "Research"], "#3b7ddd"],
  ["c6", "Registon Games", "company", "Games", "Samarkand", "15 people", "Mobile puzzle games with 2M downloads", ["Unity", "C#"], "#1f56b8"],
  ["c7", "Kelajak Tech Community", "organization", "Community", "Tashkent", "8 people", "Community and accelerator for student founders", ["Events", "AI", "Startups"], "#2a63cc"],
  ["c8", "Robo-Care", "organization", "Robotics", "Angren", "6 people", "Robotics workshops for kids in the regions", ["Arduino", "Teaching"], "#4f8be0"],
  ["c9", "Silk Road Labs", "company", "Logistics", "Tashkent", "25 people", "Route planning for Central Asian freight", ["Go", "Flutter", "Maps"], "#2552c4"],
  ["c10", "Ipak Pay", "company", "Fintech", "Tashkent", "120 people", "Payments for small shops and markets", ["Kotlin", "Java", "Security"], "#1d4fb0"],
  ["c11", "Bozor Data", "company", "E-commerce", "Tashkent", "40 people", "Price and stock data for online sellers", ["Python", "ETL", "Remote"], "#2b5fc6"],
  ["c12", "Tezkor Logistics", "company", "Logistics", "Fergana", "60 people", "Same-day courier network across the valley", ["Node.js", "React", "Maps"], "#1b4aa0"],
  ["c13", "Sarbon Health", "company", "HealthTech", "Tashkent", "30 people", "Clinic booking and patient records", ["Django", "React", "Hybrid"], "#2d68d6"],
  ["c14", "Oqim Media", "company", "Media", "Tashkent", "25 people", "Short-video studio for local brands", ["Motion", "Figma", "Content"], "#3466c8"],
  ["c15", "Chinor Cloud", "company", "Cloud", "Tashkent", "70 people", "Local cloud hosting and managed databases", ["Go", "Kubernetes", "Linux"], "#173f8f"],
  ["c16", "Mehnat AI", "company", "HR Tech", "Tashkent", "18 people", "AI screening for blue-collar hiring", ["Python", "LLM apps"], "#2a5bbf"],
  ["c17", "Tadqiqot Labs", "company", "Research", "Samarkand", "10 people", "Survey research and data dashboards", ["R", "Power BI"], "#3a72d8"],
  ["c18", "Yoshlar Code Club", "organization", "Education", "Namangan", "5 people", "Free coding club for school students", ["Teaching", "Python"], "#2f66cf"],
  ["c19", "Aral Green Tech", "company", "CleanTech", "Nukus", "14 people", "Water sensors for farms near the Aral Sea", ["IoT", "C++", "Data"], "#1f5abd"],
  ["c20", "Navbat Systems", "company", "GovTech", "Andijan", "22 people", "Queue and booking systems for public services", ["Java", "React"], "#2457bf"],
];

function companies(): CompanyProfile[] {
  return companyRows.map(([id, name, orgKind, industry, city, size, tagline, tags, hue], i) => {
    const domain = name.toLowerCase().replace(/[^a-z]/g, "");
    const pending = id === "c9";
    return {
      kind: "company",
      id,
      email: id === "c1" ? "company.approved@demo.lumora.uz" : id === "c9" ? "company.pending@demo.lumora.uz" : id === "c7" ? "org.partner@demo.lumora.uz" : `hr@${domain}.uz`,
      name,
      orgKind,
      tagline,
      industry,
      city,
      size,
      about: `${tagline}. We take interns from Lumora rounds and give each one a mentor and a real project from week one.`,
      tags,
      website: `${domain}.uz`,
      contact: `hr@${domain}.uz`,
      status: pending ? "pending" : "approved",
      statusNote: "",
      verified: !pending && i % 4 !== 2,
      partner: id === "c7",
      hue,
      createdAt: pending ? ago(1) : ago(300 - i * 10),
      logo: "",
      foundedYear: String(2012 + (i % 12)),
      benefits: pickN(["Mentor for every intern", "Flexible hours", "Lunch at the office", "Certificate and reference letter", "Paid transport", "Remote days"], 3),
      linkedin: "",
      telegram: `@${domain}_hr`,
      verification: pending ? unverified() : i % 4 !== 2 ? verified("company_email", `hr@${domain}.uz`, 120) : unverified(),
      onboarded: true,
      emailConfirmed: true,
      consentAt: ago(300 - i * 10),
      demo: true,
    };
  });
}

function admins(): AdminProfile[] {
  return [
    { kind: "admin", id: "a1", email: "admin@demo.lumora.uz", name: "Lumora Admin", level: "super", createdAt: ago(400) },
    { kind: "admin", id: "a2", email: "moderator@demo.lumora.uz", name: "Lumora Moderator", level: "moderator", createdAt: ago(120) },
  ];
}

/* ---------- postings ---------- */

type O = [companyId: string, title: string, type: OpportunityType, cat: string, level: OpportunityLevel, format: WorkFormat, schedule: Schedule, salary: [number | null, number | null]];
const oppRows: O[] = [
  ["c1", "Frontend intern (React)", "Internship", "Frontend", "intern", "hybrid", "part-time", [2000000, 2500000]],
  ["c1", "QA intern", "Internship", "Backend", "intern", "hybrid", "part-time", [1500000, 1500000]],
  ["c1", "Junior frontend developer", "Position", "Frontend", "junior", "onsite", "full-time", [6000000, 8000000]],
  ["c2", "Junior data analyst program", "Work program", "Data & AI", "intern", "remote", "part-time", [1000000, 1000000]],
  ["c2", "Data engineering intern", "Internship", "Data & AI", "intern", "remote", "part-time", [2000000, 3000000]],
  ["c3", "Flutter developer, part-time", "Position", "Mobile", "junior", "onsite", "part-time", [3000000, 4500000]],
  ["c3", "Mobile QA intern", "Internship", "Mobile", "intern", "onsite", "part-time", [1200000, 1200000]],
  ["c4", "Security analyst intern", "Internship", "Cybersecurity", "intern", "onsite", "full-time", [1500000, 2000000]],
  ["c4", "SOC trainee program", "Work program", "Cybersecurity", "intern", "onsite", "full-time", [2500000, 2500000]],
  ["c5", "Product design intern", "Internship", "UI/UX Design", "intern", "hybrid", "part-time", [null, null]],
  ["c5", "Junior UI designer", "Position", "UI/UX Design", "junior", "hybrid", "full-time", [5000000, 7000000]],
  ["c6", "Junior Unity developer", "Position", "Game Dev", "junior", "remote", "part-time", [2500000, 3500000]],
  ["c6", "Game art intern", "Internship", "Game Dev", "intern", "remote", "project", [1000000, 1500000]],
  ["c7", "Community intern", "Internship", "Product & Startup", "intern", "onsite", "part-time", [null, null]],
  ["c7", "Startup analyst program", "Work program", "Product & Startup", "intern", "hybrid", "part-time", [800000, 800000]],
  ["c7", "Founders meetup volunteer", "Event", "Product & Startup", "any", "onsite", "event", [null, null]],
  ["c8", "Robotics mentor program", "Work program", "Robotics & IoT", "any", "onsite", "part-time", [null, null]],
  ["c10", "Android intern", "Internship", "Mobile", "intern", "onsite", "full-time", [3000000, 3000000]],
  ["c10", "Junior backend developer (Java)", "Position", "Backend", "junior", "hybrid", "full-time", [8000000, 11000000]],
  ["c10", "Fraud data intern", "Internship", "Data & AI", "intern", "hybrid", "part-time", [2500000, 2500000]],
  ["c11", "Python scraping intern", "Internship", "Backend", "intern", "remote", "part-time", [2000000, 2000000]],
  ["c11", "Junior data analyst", "Position", "Data & AI", "junior", "remote", "full-time", [6000000, 7500000]],
  ["c12", "Backend intern (Node.js)", "Internship", "Backend", "intern", "onsite", "part-time", [2000000, 2500000]],
  ["c12", "Operations product intern", "Internship", "Product & Startup", "intern", "onsite", "full-time", [1800000, 1800000]],
  ["c13", "Django intern", "Internship", "Backend", "intern", "hybrid", "part-time", [2000000, 2000000]],
  ["c13", "UX researcher intern", "Internship", "UI/UX Design", "intern", "hybrid", "part-time", [1500000, 1500000]],
  ["c14", "Motion design intern", "Internship", "UI/UX Design", "intern", "onsite", "part-time", [1500000, 2000000]],
  ["c15", "DevOps intern", "Internship", "Backend", "intern", "onsite", "full-time", [3000000, 3500000]],
  ["c15", "Junior Go developer", "Position", "Backend", "junior", "hybrid", "full-time", [9000000, 12000000]],
  ["c16", "ML intern (LLM apps)", "Internship", "Data & AI", "intern", "remote", "part-time", [2500000, 3000000]],
  ["c16", "Prompt evaluation program", "Work program", "Data & AI", "any", "remote", "project", [1500000, 1500000]],
  ["c17", "Dashboard intern (Power BI)", "Internship", "Data & AI", "intern", "remote", "part-time", [1200000, 1200000]],
  ["c18", "Python teaching assistant", "Work program", "Backend", "any", "onsite", "part-time", [null, null]],
  ["c18", "Code club demo day", "Event", "Frontend", "any", "onsite", "event", [null, null]],
  ["c19", "IoT firmware intern", "Internship", "Robotics & IoT", "intern", "onsite", "full-time", [2000000, 2500000]],
  ["c19", "Field data intern", "Internship", "Data & AI", "intern", "onsite", "project", [1500000, 1500000]],
  ["c20", "Frontend intern (React)", "Internship", "Frontend", "intern", "onsite", "part-time", [1800000, 1800000]],
  ["c20", "Junior Java developer", "Position", "Backend", "junior", "onsite", "full-time", [6500000, 8500000]],
  ["c2", "Analytics meetup", "Event", "Data & AI", "any", "onsite", "event", [null, null]],
  ["c15", "Cloud security intern", "Internship", "Cybersecurity", "intern", "hybrid", "part-time", [2500000, 2500000]],
];

const respBy: Record<string, string[]> = {
  Frontend: ["Build screens from Figma designs", "Fix bugs reported by teachers and users", "Write small tests for new components"],
  Backend: ["Build and document API endpoints", "Write database queries and migrations", "Monitor errors and fix them with the team"],
  Mobile: ["Ship features in the mobile app", "Test on real Android and iOS devices", "Work with designers on new flows"],
  "Data & AI": ["Clean and join datasets", "Build dashboards the team uses weekly", "Present findings in a short weekly review"],
  "UI/UX Design": ["Run short interviews with users", "Design flows and prototypes in Figma", "Prepare designs for developers"],
  Cybersecurity: ["Run scans and triage results", "Write clear vulnerability reports", "Review code with the security team"],
  "Game Dev": ["Build small game features end to end", "Fix bugs found in playtests", "Profile and optimize scenes"],
  "Robotics & IoT": ["Assemble and test kits", "Write firmware for sensors", "Help run workshops"],
  "Product & Startup": ["Talk to users and write notes", "Prepare event logistics", "Track metrics in a weekly report"],
};
const perksAll = ["Mentor assigned on day one", "Certificate and reference letter", "Flexible hours around classes", "Paid transport", "Lunch at the office", "Chance of a full-time offer"];

function opportunities(): Opportunity[] {
  return oppRows.map(([companyId, title, type, cat, level, format, schedule, [min, max]], i) => {
    const c = companyRows.find((r) => r[0] === companyId)!;
    return {
      id: `o${i + 1}`,
      companyId,
      title,
      type,
      cats: [cat],
      city: format === "remote" ? "Remote" : c[4],
      dur: type === "Event" ? "One evening" : type === "Position" ? "Permanent" : `${8 + (i % 3) * 4} weeks`,
      pay: min ? `${min.toLocaleString("en-US")}${max && max !== min ? `–${max.toLocaleString("en-US")}` : ""} UZS per month` : type === "Event" ? "Free" : "Unpaid, certificate and reference",
      desc: type === "Event" ? `${c[1]} hosts this event: ${title}. ${c[6]}.` : `${c[1]} is hiring for this role: ${title}. ${c[6]}. You will work with a mentor on real tasks, not tutorials.`,
      req: [`Basic ${pick(skillsBy[cat])}`, level === "junior" ? "A finished project you can show" : "Curiosity and time for 15+ hours a week", "Uzbek or Russian; English is a plus"],
      postedAt: ago(1 + (i % 14)),
      hidden: false,
      hiddenReason: "",
      responsibilities: respBy[cat],
      niceToHave: [pick(skillsBy[cat]), "A Lumora round or another hackathon"],
      salaryMin: min,
      salaryMax: max,
      level,
      format,
      schedule,
      deadline: type === "Event" ? ahead(10 + (i % 20), "18:00").slice(0, 10) : ahead(14 + (i % 30)).slice(0, 10),
      openings: type === "Event" ? 40 : 1 + (i % 3),
      perks: pickN(perksAll, 3),
      questions: type === "Event" ? [] : ["Which project are you most proud of, and what was your part?", "How many hours a week can you work?"],
      closed: false,
      demo: true,
    };
  });
}

function applications(): Application[] {
  const a = (id: string, opp: string, t: string, status: Application["status"], d: number): Application => ({
    id,
    opportunityId: opp,
    talentId: t,
    status,
    note: "",
    createdAt: ago(d),
    updatedAt: ago(Math.max(0, d - 0.5)),
    cover: "I built a similar project at a Lumora round and want to do it properly with a mentor.",
    answers: ["Ilmhub, I led the team and built the frontend.", "Around 20 hours a week."],
    withCv: false,
  });
  return [
    a("ap1", "o1", "t1", "shortlisted", 2),
    a("ap2", "o1", "t2", "pending", 1),
    a("ap3", "o1", "t3", "pending", 1),
    a("ap4", "o2", "t4", "pending", 1),
    a("ap5", "o4", "t2", "pending", 3),
    a("ap6", "o30", "t2", "accepted", 5),
    a("ap7", "o3", "t11", "pending", 2),
    a("ap8", "o1", "t19", "rejected", 6),
  ];
}

function swipes(): Swipe[] {
  const s = (fromId: string, toId: string, dir: 1 | -1, d = 1): Swipe => ({ fromId, toId, dir, at: ago(d) });
  return [
    s("t1", "c1", 1, 3),
    s("c1", "t1", 1, 2),
    s("t2", "c1", 1, 2),
    s("c2", "t1", 1, 1),
    s("c2", "t2", 1, 1),
    s("c2", "t9", 1, 1),
    s("c4", "t1", 1, 1),
    s("c4", "t2", 1, 1),
    s("c3", "t9", 1, 1),
    s("c16", "t2", 1, 1),
    s("t2", "c16", 1, 4),
    s("c10", "t1", 1, 1),
  ];
}

function messages(): Message[] {
  const m = (id: string, matchId: string, fromId: string, text: string, d: number, h: number): Message => ({ id, matchId, fromId, text, at: ago(d, h) });
  return [
    m("m1", "t1__c1", "c1", "Hi Dilnoza! We liked Ilmhub. Do you have time for a short call this week about the frontend internship?", 2, 5),
    m("m2", "t1__c1", "t1", "Hi! Thank you, yes. Thursday after 16:00 works for me.", 2, 3),
    m("m3", "t1__c1", "c1", "Great, Thursday 17:00 then. We will send a link.", 2, 1),
    m("m4", "t2__c16", "c16", "Jasur, your LevelUp project is close to what we do. Want to try a two-week trial task?", 3, 2),
  ];
}

function notifications(): Notification[] {
  const n = (id: string, userId: string, kind: Notification["kind"], title: string, body: string, link: string, read: boolean, d: number): Notification => ({ id, userId, kind, title, body, link, read, at: ago(d) });
  return [
    n("n1", "t1", "application", "You're shortlisted", "NovaSoft shortlisted you for Frontend intern (React).", "#/app/profile", false, 1),
    n("n2", "t1", "match", "It's a match with NovaSoft", "You and NovaSoft swiped right on each other.", "#/app/inbox", true, 2),
    n("n3", "t1", "badge", "Badge awarded", "1st place, Lumora Demo Cup 2026 was added to your profile.", "#/app/profile", true, 150),
    n("n4", "t2", "application", "Application accepted", "Mehnat AI accepted you for ML intern (LLM apps).", "#/app/profile", false, 4),
    n("n6", "c1", "application", "New applicant", "Jasur Rahimov applied to Frontend intern (React).", "#/app/dashboard", false, 1),
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
  soloAllowed: true,
  ageMin: 14,
  ageMax: 25,
  eligibility: "High school and university students in Uzbekistan.",
  languages: ["Uzbek", "Russian", "English"],
  nominations: [] as string[],
  finalists: 0,
  judges: [] as Hackathon["judges"],
  mentors: [] as Hackathon["mentors"],
  sponsors: [] as string[],
  agenda: [] as Hackathon["agenda"],
  registrationFields: { github: false, portfolio: false, motivation: true, phone: true },
  results: [] as Hackathon["results"],
  podium: [] as string[],
  participants: 0,
  photo: "",
  demo: false,
};

const places3 = (a: string, b: string, c: string) => [
  { place: 1, title: "1st place", prize: a },
  { place: 2, title: "2nd place", prize: b },
  { place: 3, title: "3rd place", prize: c },
];

const photoFor: Record<string, string> = {
  "r-tashkent-2026-10": "school21-group",
  "r-andijan-2026-10": "andijan-room",
  "r-sirdaryo-2026-10": "andijan-teams",
  "r-bukhara-2026-09": "bukhara-build",
  "r-tashkent-2026-08": "tashkent-final",
  "r-fergana-2026-08": "fergana-pitch",
  "r-samarkand-2026-08": "regional-winners",
  "r-tashkent-2025-07": "teamwork-table",
};

function hackathons(): Hackathon[] {
  /* real past rounds */
  const past: Hackathon[] = lumora.rounds.map((r) => ({
    ...baseEvent,
    id: r.id,
    title: r.venue ? `Lumora IT Case · ${r.city.split(",")[0]}, ${r.venue}` : `Lumora IT Case · ${r.city}`,
    organizerId: "lumora",
    organizerName: "Lumora",
    eventType: "case",
    short: r.case || `One-day IT case competition in ${r.city}.`,
    description: r.case ? `Case: ${r.case}` : `Lumora IT case competition in ${r.city}.`,
    caseBrief: r.case,
    city: r.city,
    venue: r.venue,
    mode: "offline",
    start: `${r.date}T10:00`,
    end: `${r.date}T18:00`,
    regOpen: `${r.date}T00:00`,
    regClose: `${r.date}T00:00`,
    tracks: ["Frontend", "Backend", "UI/UX Design", "Product & Startup"],
    teamMin: 2,
    teamMax: 5,
    maxTeams: r.teams || 30,
    places: places3("", "", ""),
    sponsors: r.partners,
    status: "finished",
    podium: r.podium,
    participants: r.participants,
    photo: photoFor[r.id] ?? "",
    createdAt: `${r.date}T00:00:00.000Z`,
    updatedAt: `${r.date}T18:00:00.000Z`,
  }));

  /* sample event that holds demo badges */
  const demoCup: Hackathon = {
    ...baseEvent,
    id: DEMO_CUP.id,
    title: DEMO_CUP.title,
    organizerId: "lumora",
    organizerName: "Lumora",
    eventType: "case",
    short: "Sample event used to give demo profiles their badges.",
    description: "This event is sample data for the preview.",
    city: "Tashkent",
    venue: "",
    mode: "offline",
    start: `${DEMO_CUP.date}T10:00`,
    end: `${DEMO_CUP.date}T18:00`,
    regOpen: `${DEMO_CUP.date}T00:00`,
    regClose: `${DEMO_CUP.date}T00:00`,
    tracks: ["Frontend", "Backend", "UI/UX Design", "Data & AI"],
    teamMin: 2,
    teamMax: 5,
    maxTeams: 30,
    places: places3("1,000,000 UZS", "600,000 UZS", "400,000 UZS"),
    nominations: ["Best design"],
    finalists: 2,
    status: "finished",
    demo: true,
    createdAt: `${DEMO_CUP.date}T00:00:00.000Z`,
    updatedAt: `${DEMO_CUP.date}T18:00:00.000Z`,
  };

  /* the real next round, announced by the team on 25 Nov 2026: 6 December, Holiday Inn Tashkent City.
     Start time follows the usual format (case at 10:00, 8 hours); prizes, judges and capacity are not announced yet. */
  const nextRound: Hackathon = {
    ...baseEvent,
    id: "r-tashkent-2026-12",
    title: "Lumora IT Case · Tashkent, Holiday Inn Tashkent City",
    organizerId: "lumora",
    organizerName: "Lumora",
    eventType: "case",
    short: "One day, a real company case, a working prototype in 8 hours and a defence in front of the company's judges.",
    description:
      "Teams of 2 to 5 school students get a real case from a partner company, build a working prototype in 8 hours and defend it in front of judges from that company. Judges look at four things: problem, product, logic and presentation.",
    caseBrief: "Announced on the day.",
    city: "Tashkent",
    venue: "Holiday Inn Tashkent City",
    address: "3 Ukchi Street, Tashkent City",
    mode: "offline",
    start: "2026-12-06T10:00",
    end: "2026-12-06T18:00",
    regOpen: "2026-11-25T09:00",
    regClose: "2026-12-05T23:59",
    tracks: ["Frontend", "Backend", "UI/UX Design", "Product & Startup"],
    teamMin: 2,
    teamMax: 5,
    maxTeams: 30,
    places: places3("", "", ""),
    eligibility: "School students in Uzbekistan.",
    status: "registration_open",
    photo: "school21-teams",
    createdAt: "2026-11-25T09:00:00.000Z",
    updatedAt: "2026-11-25T09:00:00.000Z",
  };

  /* upcoming sample events, editable by admins */
  const upcoming: Hackathon[] = [
    nextRound,
    {
      ...baseEvent,
      id: "h1",
      title: "Lumora IT Case · Tashkent winter round",
      organizerId: "lumora",
      organizerName: "Lumora",
      eventType: "case",
      short: "One day, a real partner case, a working prototype and a defence in front of founders and CTOs.",
      description:
        "Teams get a case from a partner company at 10:00, build until 17:00 and defend a working prototype in front of the jury. Judges ask four questions: did you understand the case, does the solution work, can you defend your choices, can the team explain it clearly.",
      caseBrief: "Announced on the day.",
      city: "Tashkent",
      venue: "School 21",
      address: "Tashkent",
      mode: "offline",
      start: ahead(26),
      end: ahead(26, "18:00"),
      regOpen: ahead(-20, "09:00"),
      regClose: ahead(22, "23:59"),
      tracks: ["Frontend", "Backend", "Mobile", "Data & AI", "UI/UX Design", "Product & Startup"],
      teamMin: 2,
      teamMax: 5,
      maxTeams: 30,
      places: places3("2,000,000 UZS", "1,200,000 UZS", "800,000 UZS"),
      nominations: ["Best design"],
      finalists: 6,
      judges: lumora.judges.slice(0, 3).map((j) => ({ name: j.name, role: "Judge", company: j.org })),
      sponsors: ["AICA", "AI Alliance", "IT Park Uzbekistan"],
      agenda: [
        { time: "09:30", title: "Check-in" },
        { time: "10:00", title: "Case reveal" },
        { time: "13:00", title: "Lunch and mentor round" },
        { time: "17:00", title: "Code freeze" },
        { time: "17:15", title: "Defence in front of the jury" },
        { time: "18:45", title: "Results" },
      ],
      status: "registration_open",
      photo: "school21-teams",
      demo: true,
      createdAt: ago(20),
      updatedAt: ago(3),
    },
    {
      ...baseEvent,
      id: "h2",
      title: "Lumora IT Case · Namangan",
      organizerId: "lumora",
      organizerName: "Lumora",
      eventType: "case",
      short: "A regional round for students from Namangan and the Fergana valley.",
      description: "A one-day case competition with a regional partner case.",
      city: "Namangan",
      venue: "",
      mode: "offline",
      start: ahead(55),
      end: ahead(55, "18:00"),
      regOpen: ahead(-5, "09:00"),
      regClose: ahead(50, "23:59"),
      tracks: ["Frontend", "Backend", "Mobile", "Product & Startup"],
      teamMin: 2,
      teamMax: 5,
      maxTeams: 24,
      places: places3("1,000,000 UZS", "600,000 UZS", "400,000 UZS"),
      status: "registration_open",
      photo: "andijan-room",
      demo: true,
      createdAt: ago(10),
      updatedAt: ago(5),
    },
    {
      ...baseEvent,
      id: "h3",
      title: "Kelajak AI Weekend",
      organizerId: "c7",
      organizerName: "Kelajak Tech Community",
      eventType: "hackathon",
      short: "A partner hackathon: build an LLM app in 36 hours with mentors.",
      description: "Two days, hybrid format. Winners get mentoring from the community's founders.",
      accent: "orange",
      city: "Tashkent",
      venue: "",
      mode: "hybrid",
      onlineLink: "meet.example.com/ai-weekend",
      start: ahead(80, "09:00"),
      end: ahead(81, "18:00"),
      regOpen: ahead(-2, "09:00"),
      regClose: ahead(76, "23:59"),
      tracks: ["Data & AI", "Product & Startup"],
      teamMin: 1,
      teamMax: 4,
      maxTeams: 30,
      places: [
        { place: 1, title: "1st place", prize: "Mentoring and cloud credits" },
        { place: 2, title: "2nd place", prize: "Cloud credits" },
      ],
      registrationFields: { github: true, portfolio: false, motivation: true, phone: false },
      status: "registration_open",
      demo: true,
      createdAt: ago(8),
      updatedAt: ago(2),
    },
    {
      ...baseEvent,
      id: "h5",
      title: "Lumora IT Case · Bukhara spring round",
      organizerId: "lumora",
      organizerName: "Lumora",
      eventType: "case",
      short: "Draft. Tourism-tech case with a regional partner.",
      description: "Still being planned.",
      city: "Bukhara",
      venue: "",
      mode: "offline",
      start: ahead(140),
      end: ahead(140, "18:00"),
      regOpen: ahead(100, "09:00"),
      regClose: ahead(135, "23:59"),
      tracks: ["UI/UX Design", "Frontend", "Product & Startup"],
      teamMin: 2,
      teamMax: 5,
      maxTeams: 20,
      places: places3("TBD", "TBD", "TBD"),
      status: "draft",
      demo: true,
      createdAt: ago(1),
      updatedAt: ago(1),
    },
  ];
  return [...upcoming, demoCup, ...past];
}

function teams(events: Hackathon[], people: TalentProfile[]): TeamRegistration[] {
  const t = (id: string, hackathonId: string, teamName: string, leadId: string, members: string[], track: string): TeamRegistration => ({
    id,
    hackathonId,
    teamName,
    leadId,
    members,
    track,
    contact: people.find((p) => p.id === leadId)?.contact ?? "",
    github: "",
    portfolio: "",
    motivation: "We want to test our skills on a real case.",
    phone: "",
    createdAt: ago(3),
  });
  const list: TeamRegistration[] = [
    t("tm1", "h1", "Night Owls", "t1", ["Dilnoza Karimova", "Aziz T.", "Lola M."], "Frontend"),
    t("tm2", "h1", "Data Wizards", "t2", ["Jasur Rahimov", "Akmal R.", "Zarina K."], "Data & AI"),
    t("tm3", "h1", "Pixel Push", "t3", ["Madina Yusupova", "Saida N."], "UI/UX Design"),
    t("tm4", "h3", "Prompt Engineers", "t2", ["Jasur Rahimov"], "Data & AI"),
  ];
  const cup = events.find((e) => e.id === DEMO_CUP.id)!;
  demoAwards.forEach(([leadId, place, title, team], i) => {
    const id = `tm-cup-${i}`;
    list.push(t(id, DEMO_CUP.id, team, leadId, [people.find((p) => p.id === leadId)!.name], "Frontend"));
    cup.results.push({ key: place ? `place:${place}` : title === "Finalist" ? `finalist:${i}` : `nom:${title}`, teamId: id });
  });
  return list;
}

function badgesFor(people: TalentProfile[]) {
  for (const [leadId, place, title, team] of demoAwards) {
    const p = people.find((x) => x.id === leadId)!;
    const b: Badge = { id: `b-${leadId}`, hackathonId: DEMO_CUP.id, hackathonName: DEMO_CUP.title, place, title, teamName: team, awardedAt: `${DEMO_CUP.date}T18:00:00.000Z` };
    p.badges.push(b);
    p.projects.forEach((pr) => {
      if (pr.name === team) pr.event = DEMO_CUP.title;
    });
  }
}

function audit(): AuditEntry[] {
  const a = (id: string, actorId: string, actorName: string, action: string, target: string, detail: string, d: number): AuditEntry => ({ id, actorId, actorName, action, target, detail, at: ago(d) });
  return [
    a("au1", "a1", "Lumora Admin", "event.create", "Lumora IT Case · Tashkent winter round", "Created with 3 places and 1 nomination", 20),
    a("au2", "a2", "Lumora Moderator", "user.verify", "Madina Yusupova", "Verified talent", 12),
    a("au4", "a1", "Lumora Admin", "event.update", "Kelajak AI Weekend", "Registration opened", 2),
  ];
}

export function seed(): DB {
  rs = 20261121;
  const people = talents();
  badgesFor(people);
  const users = [...people, ...companies(), ...admins()];
  const creds: Credential[] = DEMO_ACCOUNTS.map((d) => {
    const salt = `seed-${d.userId}`;
    return { email: d.email, hash: hashPassword(d.password, salt), salt, userId: d.userId };
  });
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
    teams: teams(events, people),
    audit: audit(),
    tokens: [],
    outbox: [],
  };
}
