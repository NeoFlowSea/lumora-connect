import type { ReactNode } from "react";
import { Briefcase, FileText, Github, Globe, GraduationCap, Languages, Linkedin, MapPin, MessageCircle, Send, Trophy } from "lucide-react";
import { Shield } from "../../components/Logo";
import { Modal, Pill, btn } from "../../components/ui";
import { trackLabel, useLang } from "../../i18n";
import type { ApplicationStatus, Badge, CompanyProfile, TalentProfile, User } from "../../api/types";
import { formatLabel, href, proofLabel, shortUrl } from "../jobs/format";

/* Small shared pieces for the dashboard, inbox, notifications, profile, swipe and the public pages. */

/* deterministic monogram tones from the blue side of the palette, never yellow */
const TONES = [
  { bg: "#3d7bfa", fg: "#ffffff" },
  { bg: "#2f67e0", fg: "#ffffff" },
  { bg: "#1f56b8", fg: "#dbe6ff" },
  { bg: "#173f8f", fg: "#b9cdff" },
  { bg: "#8db0ff", fg: "#0f2557" },
  { bg: "#264f9e", fg: "#e3ecff" },
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** two letters: first letters of the first two words, or the first two letters of a single word */
export function monogram(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Photo or logo when there is one, otherwise a two-letter monogram.
 * shape "circle" for people, "square" for company logos.
 * tone keeps the old fixed colors for callers that pass it.
 */
export function Avatar({
  name,
  size = 40,
  tone,
  src,
  shape = "circle",
  className = "",
}: {
  name: string;
  size?: number;
  tone?: "blue" | "accent" | "paper";
  src?: string;
  shape?: "circle" | "square";
  className?: string;
}) {
  const radius = shape === "square" ? (size >= 56 ? "rounded-xl" : "rounded-lg") : "rounded-full";
  if (src && /^(data:|https?:|\.?\/)/.test(src)) {
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className={`shrink-0 bg-surface object-cover ${radius} ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  const fixed = tone ? { blue: "bg-blue text-white", accent: "bg-accent text-paper", paper: "bg-paper text-sky ring-1 ring-line" }[tone] : "";
  const auto = tone ? undefined : TONES[hash(name) % TONES.length];
  return (
    <span
      className={`inline-grid shrink-0 select-none place-items-center font-semibold tracking-tight ${radius} ${fixed} ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(12, Math.round(size * 0.36)), background: auto?.bg, color: auto?.fg }}
      aria-hidden
    >
      {monogram(name)}
    </span>
  );
}

export function Verified({ on, showOff = false, proof }: { on: boolean; showOff?: boolean; proof?: string }) {
  const { t } = useLang();
  if (!on && !showOff) return null;
  if (!on) return <span className="text-[12px] text-mist">{t("common.status.unverified")}</span>;
  return (
    <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-sky" title={proof ? t("jobs.verifiedBy", { proof }) : t("jobs.verifiedTitle")}>
      <Shield size={10} mono="#8db0ff" /> {t("common.status.verified")}
    </span>
  );
}

/** "Demo profile" / "Sample" tag on seeded records */
export function DemoTag({ sample = false }: { sample?: boolean }) {
  const { t } = useLang();
  return (
    <span className="inline-flex shrink-0 items-center rounded-md border border-dashed border-line px-1.5 py-0.5 text-[12px] font-medium text-mist" title={t("jobs.demoHint")}>
      {sample ? t("jobs.sample") : t("common.status.demo")}
    </span>
  );
}

const appStatusCls: Record<ApplicationStatus, string> = {
  pending: "border border-line text-mist",
  shortlisted: "bg-tint text-sky",
  accepted: "bg-good/15 text-good",
  rejected: "bg-bad/15 text-[#ffb3b3]",
};

export function AppStatusPill({ status }: { status: ApplicationStatus }) {
  const { t } = useLang();
  return <span className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[12px] font-semibold ${appStatusCls[status]}`}>{t(`jobs.appStatus.${status}`)}</span>;
}

export function BadgeRow({ badges, max = 3 }: { badges: Badge[]; max?: number }) {
  const { t } = useLang();
  if (!badges.length) return null;
  const shown = badges.slice(-max).reverse();
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((b) => (
        <span key={b.id} className="inline-flex items-center gap-1 rounded-md bg-accent/15 px-2 py-0.5 text-[12px] font-semibold text-accent">
          <Trophy size={12} /> {b.title}, {b.hackathonName}
        </span>
      ))}
      {badges.length > max && <span className="self-center text-[12px] text-mist">{t("jobs.more", { n: badges.length - max })}</span>}
    </div>
  );
}

export function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3">
      <div className="text-[22px] font-semibold tabular-nums text-accent">{value}</div>
      <div className="text-[12px] text-mist">{label}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  if (!value) return null;
  return (
    <div className="grid min-w-0 gap-0.5">
      <span className="text-[12px] text-mist">{label}</span>
      <span className="break-words text-[14px]">{value}</span>
    </div>
  );
}

export function Tags({ items, max }: { items: string[]; max?: number }) {
  const { t } = useLang();
  if (!items.length) return null;
  const shown = max ? items.slice(0, max) : items;
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((s) => (
        <span key={s} className="rounded-md bg-tint px-2 py-0.5 text-[12px] font-semibold text-sky">
          {s}
        </span>
      ))}
      {max && items.length > max && <span className="self-center text-[12px] text-mist">{t("jobs.more", { n: items.length - max })}</span>}
    </div>
  );
}

export function ExtLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <a href={to} target="_blank" rel="noreferrer noopener" className="inline-flex min-w-0 items-center gap-1.5 break-all text-sky underline-offset-2 hover:underline">
      {children}
    </a>
  );
}

export function TalentDetails({ t: p, contacts = false }: { t: TalentProfile; contacts?: boolean }) {
  const { t } = useLang();
  const edu = [p.education.institution, p.education.program, p.education.year].filter(Boolean).join(", ");
  return (
    <div className="grid gap-5">
      <div className="flex items-center gap-4">
        <Avatar name={p.name} src={p.photo} size={56} />
        <div className="min-w-0">
          <h2 className="text-[22px]">{p.name}</h2>
          {p.headline && <p className="mt-0.5 text-[14px] text-ink/90">{p.headline}</p>}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-mist">
            <span>{trackLabel(p.cat)}</span>
            {p.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} /> {p.city}
              </span>
            )}
            {p.age && <span>{t("jobs.talent.age", { n: p.age })}</span>}
            <Verified on={p.verified} showOff proof={proofLabel(p.verification.proof)} />
            {p.demo && <DemoTag />}
          </div>
        </div>
      </div>
      {p.bio && <p className="text-[14px] leading-relaxed">{p.bio}</p>}
      {p.badges.length > 0 && (
        <div className="grid gap-2">
          <span className="text-[12px] text-mist">{t("jobs.talent.results")}</span>
          <BadgeRow badges={p.badges} max={6} />
        </div>
      )}
      <Tags items={p.skills} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Row
          label={t("jobs.talent.education")}
          value={
            edu ? (
              <span className="inline-flex items-start gap-1.5">
                <GraduationCap size={14} className="mt-0.5 shrink-0 text-mist" /> {edu}
              </span>
            ) : null
          }
        />
        <Row
          label={t("jobs.talent.languages")}
          value={
            p.languages.length ? (
              <span className="inline-flex items-start gap-1.5">
                <Languages size={14} className="mt-0.5 shrink-0 text-mist" /> {p.languages.join(", ")}
              </span>
            ) : null
          }
        />
        <Row label={t("jobs.talent.roles")} value={p.roles.join(", ")} />
        <Row label={t("jobs.talent.formats")} value={p.workFormats.map(formatLabel).join(", ")} />
        <Row label={t("jobs.talent.stipend")} value={p.expectedStipend} />
        <Row label={t("jobs.talent.availability")} value={p.avail} />
        <Row label={t("jobs.talent.project")} value={p.projects[0]?.name || p.project} />
        <Row
          label="GitHub"
          value={
            p.github ? (
              <ExtLink to={href("github", p.github)}>
                <Github size={13} /> {shortUrl(p.github)}
              </ExtLink>
            ) : null
          }
        />
        <Row label={t("jobs.talent.portfolio")} value={p.portfolio && p.portfolio !== p.github ? <ExtLink to={href("web", p.portfolio)}>{shortUrl(p.portfolio)}</ExtLink> : null} />
        <Row label={t("jobs.talent.cv")} value={p.cv ? <a href={p.cv.dataUrl} download={p.cv.name} className="inline-flex items-center gap-1.5 text-sky hover:underline"><FileText size={13} /> {p.cv.name}</a> : null} />
        {contacts && <Row label={t("jobs.talent.contact")} value={p.contact} />}
      </div>
    </div>
  );
}

export function CompanyDetails({ c }: { c: CompanyProfile }) {
  const { t } = useLang();
  return (
    <div className="grid gap-5">
      <div className="flex items-center gap-4">
        <Avatar name={c.name} src={c.logo} size={56} shape="square" />
        <div className="min-w-0">
          <h2 className="text-[22px]">{c.name}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-mist">
            <span>{t(c.orgKind === "organization" ? "jobs.company.org" : "jobs.company.company")}</span>
            <span>{c.industry}</span>
            {c.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} /> {c.city}
              </span>
            )}
            <Verified on={c.verified} proof={proofLabel(c.verification.proof)} />
            {c.partner && <Pill tone="blue">{t("jobs.company.partner")}</Pill>}
            {c.demo && <DemoTag />}
          </div>
        </div>
      </div>
      {c.tagline && <p className="text-[15px]">{c.tagline}</p>}
      {c.about && <p className="text-[14px] leading-relaxed text-mist">{c.about}</p>}
      <Tags items={c.tags} />
      {c.benefits.length > 0 && (
        <div className="grid gap-2">
          <span className="text-[12px] text-mist">{t("jobs.company.benefits")}</span>
          <ul className="grid gap-1 text-[14px]">
            {c.benefits.map((b) => (
              <li key={b} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky" aria-hidden />
                {b}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Row label={t("jobs.company.size")} value={c.size} />
        <Row label={t("jobs.company.founded")} value={c.foundedYear} />
        <Row
          label={t("jobs.company.website")}
          value={
            c.website ? (
              <ExtLink to={href("web", c.website)}>
                <Globe size={13} /> {shortUrl(c.website)}
              </ExtLink>
            ) : null
          }
        />
        <Row
          label="Telegram"
          value={
            c.telegram ? (
              <ExtLink to={href("telegram", c.telegram)}>
                <Send size={13} /> {c.telegram}
              </ExtLink>
            ) : null
          }
        />
        <Row
          label="LinkedIn"
          value={
            c.linkedin ? (
              <ExtLink to={href("linkedin", c.linkedin)}>
                <Linkedin size={13} /> {shortUrl(c.linkedin)}
              </ExtLink>
            ) : null
          }
        />
        <Row label={t("jobs.company.contact")} value={c.contact} />
      </div>
    </div>
  );
}

/** Profile of a talent or company in a modal, with an optional message action and a link to the full page. */
export function UserInfoModal({ user, onClose, onMessage }: { user: User | null; onClose: () => void; onMessage?: () => void }) {
  const { t } = useLang();
  const page = user?.kind === "talent" ? `#/app/talent/${user.id}` : user?.kind === "company" ? `#/company/${user.id}` : "";
  return (
    <Modal open={!!user} onClose={onClose}>
      {user?.kind === "talent" && <TalentDetails t={user} contacts={!!onMessage} />}
      {user?.kind === "company" && <CompanyDetails c={user} />}
      <div className="mt-7 flex flex-wrap gap-3">
        {onMessage && (
          <button onClick={onMessage} className={btn.primary}>
            <MessageCircle size={16} /> {t("jobs.message")}
          </button>
        )}
        {page && (
          <a href={page} onClick={onClose} className={btn.secondary}>
            <Briefcase size={16} /> {t("jobs.fullProfile")}
          </a>
        )}
        <button onClick={onClose} className={btn.ghost}>
          {t("common.action.close")}
        </button>
      </div>
    </Modal>
  );
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <h2 className="text-[18px] md:text-[20px]">{children}</h2>
      {aside}
    </div>
  );
}
