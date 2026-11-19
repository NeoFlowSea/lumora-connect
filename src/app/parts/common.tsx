import type { ReactNode } from "react";
import { Globe, MapPin, MessageCircle, Trophy } from "lucide-react";
import { Shield } from "../../components/Logo";
import { Modal, Pill, btn, initials } from "../../components/ui";
import type { ApplicationStatus, Badge, CompanyProfile, TalentProfile, User } from "../../api/types";

/* Small shared pieces for the dashboard, inbox, notifications and profile screens. */

export function Avatar({ name, size = 40, tone = "blue" }: { name: string; size?: number; tone?: "blue" | "accent" | "paper" }) {
  const cls = { blue: "bg-blue text-white", accent: "bg-accent text-paper", paper: "bg-paper text-sky ring-1 ring-line" }[tone];
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-full font-semibold ${cls}`}
      style={{ width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.32)) }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

export function Verified({ on, showOff = false }: { on: boolean; showOff?: boolean }) {
  if (!on && !showOff) return null;
  if (!on) return <span className="text-[11px] text-mist">not verified</span>;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky" title="Verified by Lumora">
      <Shield size={9} mono="#8db0ff" /> verified
    </span>
  );
}

const appStatusCls: Record<ApplicationStatus, string> = {
  pending: "border border-line text-mist",
  shortlisted: "bg-tint text-sky",
  accepted: "bg-good/15 text-good",
  rejected: "bg-bad/15 text-[#ffb3b3]",
};
const appStatusLabel: Record<ApplicationStatus, string> = {
  pending: "Pending",
  shortlisted: "Shortlisted",
  accepted: "Accepted",
  rejected: "Not selected",
};

export function AppStatusPill({ status }: { status: ApplicationStatus }) {
  return <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[12px] font-semibold ${appStatusCls[status]}`}>{appStatusLabel[status]}</span>;
}

export function BadgeRow({ badges, max = 3 }: { badges: Badge[]; max?: number }) {
  if (!badges.length) return null;
  const shown = badges.slice(-max).reverse();
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((b) => (
        <span key={b.id} className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-semibold text-accent">
          <Trophy size={11} /> {b.title}, {b.hackathonName}
        </span>
      ))}
      {badges.length > max && <span className="text-[11px] text-mist">+{badges.length - max} more</span>}
    </div>
  );
}

export function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-3">
      <div className="text-[22px] font-semibold text-accent">{value}</div>
      <div className="text-[12px] text-mist">{label}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  if (!value) return null;
  return (
    <div className="grid gap-0.5">
      <span className="text-[11px] text-mist">{label}</span>
      <span className="break-words text-[14px]">{value}</span>
    </div>
  );
}

export function TalentDetails({ t }: { t: TalentProfile }) {
  return (
    <div className="grid gap-5">
      <div className="flex items-center gap-4">
        <Avatar name={t.name} size={56} />
        <div className="min-w-0">
          <h2 className="truncate text-[22px]">{t.name}</h2>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-mist">
            <span>{t.cat}</span>
            {t.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} /> {t.city}
              </span>
            )}
            {t.age && <span>{t.age} y.o.</span>}
            <Verified on={t.verified} showOff />
          </div>
        </div>
      </div>
      {t.bio && <p className="text-[14px] leading-relaxed">{t.bio}</p>}
      {t.badges.length > 0 && (
        <div className="grid gap-2">
          <span className="text-[11px] text-mist">Hackathon results</span>
          <BadgeRow badges={t.badges} max={6} />
        </div>
      )}
      {t.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {t.skills.map((s) => (
            <span key={s} className="rounded-md bg-tint px-2 py-1 text-[12px] font-semibold text-sky">
              {s}
            </span>
          ))}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Row label="Project" value={t.project} />
        <Row label="Availability" value={t.avail} />
        <Row label="Portfolio" value={t.portfolio} />
        <Row label="Contact" value={t.contact} />
      </div>
    </div>
  );
}

export function CompanyDetails({ c }: { c: CompanyProfile }) {
  return (
    <div className="grid gap-5">
      <div className="flex items-center gap-4">
        <Avatar name={c.name} size={56} tone="paper" />
        <div className="min-w-0">
          <h2 className="truncate text-[22px]">{c.name}</h2>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-mist">
            <span>{c.orgKind === "organization" ? "Organization" : "Company"}</span>
            <span>{c.industry}</span>
            {c.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} /> {c.city}
              </span>
            )}
            <Verified on={c.verified} />
            {c.partner && <Pill tone="blue">Lumora partner</Pill>}
          </div>
        </div>
      </div>
      {c.tagline && <p className="text-[15px]">{c.tagline}</p>}
      {c.about && <p className="text-[14px] leading-relaxed text-mist">{c.about}</p>}
      {c.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {c.tags.map((s) => (
            <span key={s} className="rounded-md bg-tint px-2 py-1 text-[12px] font-semibold text-sky">
              {s}
            </span>
          ))}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Row label="Size" value={c.size} />
        <Row
          label="Website"
          value={
            c.website ? (
              <span className="inline-flex items-center gap-1">
                <Globe size={12} /> {c.website}
              </span>
            ) : null
          }
        />
        <Row label="Contact" value={c.contact} />
      </div>
    </div>
  );
}

/** Profile of a talent or company in a modal, with an optional message action. */
export function UserInfoModal({ user, onClose, onMessage }: { user: User | null; onClose: () => void; onMessage?: () => void }) {
  return (
    <Modal open={!!user} onClose={onClose}>
      {user?.kind === "talent" && <TalentDetails t={user} />}
      {user?.kind === "company" && <CompanyDetails c={user} />}
      <div className="mt-7 flex flex-wrap gap-3">
        {onMessage && (
          <button onClick={onMessage} className={btn.primary}>
            <MessageCircle size={16} /> Message
          </button>
        )}
        <button onClick={onClose} className={btn.ghost}>
          Close
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
