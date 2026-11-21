/* Domain model for Lumora Connect. The mock API (src/api/mock.ts) and any
   future real backend both speak these types. */

export type Role = "talent" | "company" | "admin";
export type AdminLevel = "super" | "moderator";
export type OrgKind = "company" | "organization";
export type CompanyStatus = "pending" | "approved" | "rejected";

export interface Badge {
  id: string;
  hackathonId: string;
  hackathonName: string;
  /** 1, 2, 3... for ranked places; null for nominations and finalists */
  place: number | null;
  /** "1st place", "Best design", "Finalist" */
  title: string;
  teamName?: string;
  awardedAt: string;
}

export type WorkFormat = "onsite" | "remote" | "hybrid";
export type VerificationLevel = "unverified" | "pending" | "verified";
export type VerificationProof = "event" | "university_email" | "github" | "company_email" | "admin" | "";

/** Two account levels: a short sign-up gives an unverified account; a full profile plus one proof makes it verified. */
export interface Verification {
  level: VerificationLevel;
  proof: VerificationProof;
  proofValue: string;
  requestedAt: string;
  reviewedAt: string;
  note: string;
}

export interface EducationEntry {
  institution: string;
  level: "school" | "lyceum" | "college" | "university" | "course" | "";
  program: string;
  year: string;
}

export interface ExperienceEntry {
  id: string;
  title: string;
  org: string;
  period: string;
  desc: string;
}

export interface ProjectEntry {
  id: string;
  name: string;
  url: string;
  role: string;
  desc: string;
  event: string;
}

export interface FileRef {
  name: string;
  size: number;
  /** data URL, kept in the browser for this preview */
  dataUrl: string;
}

export interface TalentProfile {
  kind: "talent";
  id: string;
  email: string;
  name: string;
  cat: string;
  city: string;
  age: number | null;
  bio: string;
  skills: string[];
  project: string;
  avail: string;
  contact: string;
  portfolio: string;
  verified: boolean;
  badges: Badge[];
  createdAt: string;
  /* richer profile */
  photo: string;
  headline: string;
  region: string;
  education: EducationEntry;
  languages: string[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  cv: FileRef | null;
  roles: string[];
  workFormats: WorkFormat[];
  expectedStipend: string;
  github: string;
  linkedin: string;
  verification: Verification;
  onboarded: boolean;
  emailConfirmed: boolean;
  consentAt: string;
  /** seeded sample person, shown with a "Demo profile" tag */
  demo: boolean;
}

export interface CompanyProfile {
  kind: "company";
  id: string;
  email: string;
  name: string;
  orgKind: OrgKind;
  tagline: string;
  industry: string;
  city: string;
  size: string;
  about: string;
  tags: string[];
  website: string;
  contact: string;
  status: CompanyStatus;
  statusNote: string;
  verified: boolean;
  partner: boolean;
  hue: string;
  createdAt: string;
  logo: string;
  foundedYear: string;
  benefits: string[];
  linkedin: string;
  telegram: string;
  verification: Verification;
  onboarded: boolean;
  emailConfirmed: boolean;
  consentAt: string;
  demo: boolean;
}

export interface AdminProfile {
  kind: "admin";
  id: string;
  email: string;
  name: string;
  level: AdminLevel;
  createdAt: string;
}

export type User = TalentProfile | CompanyProfile | AdminProfile;

export interface Credential {
  email: string;
  /** salted SHA-256, see src/api/crypto.ts. Still a browser mock, not production security. */
  hash: string;
  salt: string;
  userId: string;
}

/** tokens for password reset and email confirmation */
export interface Token {
  token: string;
  userId: string;
  kind: "reset" | "confirm";
  expires: string;
}

/** emails the preview would have sent; shown in the interface instead of a real mailbox */
export interface OutboxMail {
  id: string;
  to: string;
  subject: string;
  body: string;
  link: string;
  at: string;
}

export type OpportunityType = "Internship" | "Work program" | "Position" | "Event";
export type OpportunityLevel = "intern" | "junior" | "middle" | "any";
export type Schedule = "full-time" | "part-time" | "project" | "event";

export interface Opportunity {
  id: string;
  companyId: string;
  title: string;
  type: OpportunityType;
  cats: string[];
  city: string;
  dur: string;
  pay: string;
  desc: string;
  req: string[];
  postedAt: string;
  hidden: boolean;
  hiddenReason: string;
  responsibilities: string[];
  niceToHave: string[];
  /** monthly, in UZS; null when unpaid or not disclosed */
  salaryMin: number | null;
  salaryMax: number | null;
  level: OpportunityLevel;
  format: WorkFormat;
  schedule: Schedule;
  deadline: string;
  openings: number;
  perks: string[];
  questions: string[];
  closed: boolean;
  demo: boolean;
}

export type ApplicationStatus = "pending" | "shortlisted" | "accepted" | "rejected";

export interface Application {
  id: string;
  opportunityId: string;
  talentId: string;
  status: ApplicationStatus;
  note: string;
  createdAt: string;
  updatedAt: string;
  cover: string;
  answers: string[];
  withCv: boolean;
}

export interface Swipe {
  fromId: string;
  toId: string;
  dir: 1 | -1;
  at: string;
}

export interface Match {
  /** stable id: talentId + "__" + companyId */
  id: string;
  talentId: string;
  companyId: string;
  at: string;
}

export interface Message {
  id: string;
  matchId: string;
  fromId: string;
  text: string;
  at: string;
}

export type NotificationKind = "match" | "application" | "company_status" | "badge" | "verified" | "event" | "system";

export interface Notification {
  id: string;
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** hash route to open, e.g. "#/app/inbox" */
  link: string;
  read: boolean;
  at: string;
}

/* ---------- hackathons and events ---------- */

export type EventType = "hackathon" | "case" | "meetup" | "workshop";
export type EventMode = "offline" | "online" | "hybrid";
export type EventStatus =
  | "draft"
  | "published"
  | "registration_open"
  | "registration_closed"
  | "in_progress"
  | "finished"
  | "cancelled";
export type EventAccent = "blue" | "yellow" | "sky" | "navy";

export interface Place {
  place: number;
  title: string;
  prize: string;
}

export interface Person {
  name: string;
  role: string;
  company: string;
}

export interface AgendaItem {
  time: string;
  title: string;
}

export interface RegistrationFields {
  github: boolean;
  portfolio: boolean;
  motivation: boolean;
  phone: boolean;
}

/** key is "place:1", "place:2"... or "nom:Best design" or "finalist:1" */
export interface Result {
  key: string;
  teamId: string;
}

export interface Hackathon {
  id: string;
  title: string;
  organizerId: string; // "lumora" or a company id
  organizerName: string;
  eventType: EventType;
  short: string;
  description: string;
  caseBrief: string;
  accent: EventAccent;

  city: string;
  venue: string;
  address: string;
  mode: EventMode;
  onlineLink: string;

  /** local date-time strings, "2026-12-20T10:00" */
  start: string;
  end: string;
  timezone: string;
  regOpen: string;
  regClose: string;

  tracks: string[];
  teamMin: number;
  teamMax: number;
  soloAllowed: boolean;
  maxTeams: number;
  ageMin: number;
  ageMax: number;
  eligibility: string;
  languages: string[];

  places: Place[];
  nominations: string[];
  finalists: number;

  judges: Person[];
  mentors: Person[];
  sponsors: string[];
  agenda: AgendaItem[];

  status: EventStatus;
  registrationFields: RegistrationFields;
  results: Result[];
  /** past rounds imported from Lumora history: podium team names and turnout */
  podium: string[];
  participants: number;
  photo: string;
  demo: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface TeamRegistration {
  id: string;
  hackathonId: string;
  teamName: string;
  leadId: string;
  members: string[];
  track: string;
  contact: string;
  github: string;
  portfolio: string;
  motivation: string;
  phone: string;
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  target: string;
  detail: string;
  at: string;
}

export interface DB {
  schema: number;
  version: number;
  users: User[];
  creds: Credential[];
  opportunities: Opportunity[];
  applications: Application[];
  swipes: Swipe[];
  messages: Message[];
  notifications: Notification[];
  hackathons: Hackathon[];
  teams: TeamRegistration[];
  audit: AuditEntry[];
  tokens: Token[];
  outbox: OutboxMail[];
}

/* ---------- inputs ---------- */

/** short sign-up: only what is needed to start. The rest comes later in onboarding. */
export type RegisterInput =
  | { type: "talent"; email: string; password: string; name: string; cat: string; city: string; consent: boolean }
  | { type: "company"; email: string; password: string; name: string; orgKind: OrgKind; city: string; consent: boolean };

export type HackathonInput = Omit<Hackathon, "id" | "createdAt" | "updatedAt" | "results" | "podium" | "participants" | "photo" | "demo"> &
  Partial<Pick<Hackathon, "podium" | "participants" | "photo" | "demo">>;

export type OpportunityInput = Omit<Opportunity, "id" | "companyId" | "postedAt" | "hidden" | "hiddenReason" | "demo">;

export type TeamInput = Omit<TeamRegistration, "id" | "hackathonId" | "leadId" | "createdAt">;
