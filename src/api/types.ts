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
  /** Mock only: stored in plain text in the visitor's own browser. Never do this with a real backend. */
  password: string;
  userId: string;
}

export type OpportunityType = "Internship" | "Work program" | "Position" | "Event";

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
}

/* ---------- inputs ---------- */

export type RegisterInput =
  | {
      type: "talent";
      email: string;
      password: string;
      name: string;
      cat: string;
      city: string;
      age: number | null;
      skills: string[];
      contact: string;
    }
  | {
      type: "company";
      email: string;
      password: string;
      name: string;
      orgKind: OrgKind;
      industry: string;
      city: string;
      size: string;
      website: string;
      contact: string;
      about: string;
    };

export type HackathonInput = Omit<Hackathon, "id" | "createdAt" | "updatedAt" | "results">;

export type OpportunityInput = Omit<Opportunity, "id" | "companyId" | "postedAt" | "hidden" | "hiddenReason">;

export type TeamInput = Omit<TeamRegistration, "id" | "hackathonId" | "leadId" | "createdAt">;
