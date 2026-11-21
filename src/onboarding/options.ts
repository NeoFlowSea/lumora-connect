import { t } from "../i18n";
import { categories } from "../data";
import type { EducationEntry, WorkFormat } from "../api/types";

/* Option lists shared by sign-up, onboarding and the profile editor.
   Values are stored in English (like the seeded data); labels come from the "profile" dictionary. */

/** translated label for a stored value, or the value itself when there is no translation (custom entries) */
export function lbl(prefix: string, value: string): string {
  if (!value) return value;
  const key = `profile.${prefix}.${value}`;
  const s = t(key);
  return s === key ? value : s;
}

export const TRACKS = categories.map((c) => c.name);
/** shared track labels live in src/i18n (common.track.*); re-exported so every screen here uses the same ones */
export { trackLabel } from "../i18n";

export const CITIES = [
  "Tashkent",
  "Samarkand",
  "Bukhara",
  "Fergana",
  "Andijan",
  "Namangan",
  "Nukus",
  "Karshi",
  "Termez",
  "Jizzakh",
  "Guliston",
  "Navoi",
  "Urgench",
  "Chirchiq",
  "Angren",
];
export const cityLabel = (v: string) => lbl("city", v);

export const LANGUAGES = ["Uzbek", "Russian", "English", "Karakalpak", "Tajik", "Kazakh", "Turkish", "Korean", "German", "Chinese", "Arabic", "French"];
export const languageLabel = (v: string) => lbl("language", v);

export const EDU_LEVELS: Exclude<EducationEntry["level"], "">[] = ["school", "lyceum", "college", "university", "course"];
export const FORMATS: WorkFormat[] = ["onsite", "remote", "hybrid"];
export const formatLabel = (v: WorkFormat) => t(`common.format.${v}`);

export const AVAIL = ["Part-time", "Full-time (summer)", "Weekends", "Remote only", "Full-time"];
export const availLabel = (v: string) => lbl("avail", v);

export const SKILLS_BY_TRACK: Record<string, string[]> = {
  Frontend: ["React", "TypeScript", "JavaScript", "HTML and CSS", "Tailwind", "Next.js", "Vue", "Figma"],
  Backend: ["Python", "Node.js", "Go", "Java", "PostgreSQL", "FastAPI", "Django", "Docker"],
  Mobile: ["Flutter", "Dart", "Kotlin", "Swift", "React Native", "Firebase"],
  "Data & AI": ["Python", "SQL", "Pandas", "scikit-learn", "Power BI", "LLM apps", "Excel"],
  "UI/UX Design": ["Figma", "Prototyping", "User research", "Design systems", "Framer", "Illustration"],
  Cybersecurity: ["Linux", "Networking", "Burp Suite", "CTF", "Python", "OWASP"],
  "Game Dev": ["Unity", "C#", "Godot", "Blender", "Unreal"],
  "Robotics & IoT": ["Arduino", "C++", "Raspberry Pi", "Embedded C", "3D printing"],
  "Product & Startup": ["Pitching", "Market research", "Notion", "No-code", "Figma", "Analytics"],
};
export const COMMON_SKILLS = ["Git", "English", "Teamwork", "Public speaking"];

export const ROLES_BY_TRACK: Record<string, string[]> = {
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
export const COMMON_ROLES = ["Internship", "Part-time job", "Project work"];
export const roleLabel = (v: string) => lbl("role", v);

export const SIZES = ["1-10 people", "11-50 people", "51-200 people", "201-500 people", "500+ people"];
export const sizeLabel = (v: string) => lbl("size", v);

export const INDUSTRIES = ["EdTech", "Fintech", "E-commerce", "Logistics", "HealthTech", "Data", "AI", "Security", "Games", "Media", "Telecom", "Education", "Community", "Government"];

export const BENEFITS = [
  "Paid internship",
  "Mentor",
  "Flexible hours",
  "Remote days",
  "Certificate",
  "Reference letter",
  "Job offer after internship",
  "Free lunch",
  "Learning budget",
  "Team events",
];
export const benefitLabel = (v: string) => lbl("benefit", v);

export const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
