import { useState, type FormEvent } from "react";
import { Briefcase, CalendarDays, LayoutDashboard, LogOut, MapPin, MessageCircle, Pencil, RotateCcw, Trophy, Users } from "lucide-react";
import { api } from "../api";
import { useAction, useApi, useSession } from "../api/hooks";
import type { CompanyProfile, OrgKind, TalentProfile } from "../api/types";
import { categories } from "../data";
import { Card, Empty, ErrorNote, Field, Input, Select, Skeleton, Spinner, Textarea, ago, when } from "../components/form";
import { Modal, Pill, btn, useToast } from "../components/ui";
import { go } from "../lib/router";
import { AppStatusPill, Avatar, SectionTitle, Stat, Verified } from "./parts/common";

const AVAIL = ["Part-time", "Full-time (summer)", "Weekends", "Remote only", "Full-time"];
const SIZES = ["1 to 10 people", "11 to 50 people", "51 to 200 people", "200+ people"];

export function ProfileTab() {
  const user = useSession();
  if (!user || user.kind === "admin") return null;
  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <div className="grid content-start gap-6">
        {user.kind === "talent" ? <TalentHeader t={user} /> : <CompanyHeader c={user} />}
        <AccountCard />
      </div>
      <div className="grid content-start gap-6">
        {user.kind === "talent" ? <TalentDetails t={user} /> : <CompanyDetails c={user} />}
      </div>
    </div>
  );
}

/* ---------- talent ---------- */

function TalentHeader({ t }: { t: TalentProfile }) {
  const liked = useApi(() => api.swipe.liked(), []);
  const apps = useApi(() => api.opportunities.myApplications(), []);
  const teams = useApi(() => api.hackathons.myTeams(), []);
  return (
    <Card className="overflow-hidden p-0 md:p-0">
      <div className="h-24 bg-gradient-to-br from-blue to-paper" />
      <div className="-mt-10 px-5 pb-5 md:px-6 md:pb-6">
        <span className="inline-block rounded-full border-4 border-surface">
          <Avatar name={t.name} size={72} />
        </span>
        <h1 className="mt-3 text-[24px]">{t.name}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-mist">
          <span>{t.cat}</span>
          {t.city && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} /> {t.city}
            </span>
          )}
          {t.age && <span>{t.age} y.o.</span>}
        </div>
        <div className="mt-3">
          {t.verified ? (
            <Verified on />
          ) : (
            <p className="rounded-xl border border-line px-3 py-2 text-[12px] text-mist">
              Not verified yet. Admins verify talent after a first Lumora event or a confirmed result.
            </p>
          )}
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2">
          <Stat value={liked.data?.length ?? "–"} label="saved" />
          <Stat value={apps.data?.length ?? "–"} label="applied" />
          <Stat value={teams.data?.length ?? "–"} label="teams" />
        </div>
      </div>
    </Card>
  );
}

function TalentDetails({ t }: { t: TalentProfile }) {
  const [editing, setEditing] = useState(false);
  return (
    <>
      <Card>
        <SectionTitle
          aside={
            !editing && (
              <button onClick={() => setEditing(true)} className={`${btn.sm} border border-line hover:bg-tint`}>
                <Pencil size={13} /> Edit profile
              </button>
            )
          }
        >
          About
        </SectionTitle>
        {editing ? <TalentForm t={t} onDone={() => setEditing(false)} /> : <TalentView t={t} />}
      </Card>
      <Card>
        <SectionTitle>Hackathon results</SectionTitle>
        {t.badges.length === 0 ? (
          <Empty
            icon={<Trophy size={20} />}
            title="No results yet"
            text="Places and nominations from Lumora hackathons appear here once the organizers publish results."
            action={
              <button onClick={() => go("#/app/hackathons")} className={btn.primary}>
                Find a hackathon
              </button>
            }
          />
        ) : (
          <ul className="grid gap-2">
            {t.badges
              .slice()
              .reverse()
              .map((b) => (
                <li key={b.id} className="flex items-center gap-3 rounded-2xl bg-paper/50 px-4 py-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/15 text-accent">
                    <Trophy size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{b.title}</span>
                    <span className="block truncate text-[12px] text-mist">
                      {b.hackathonName}
                      {b.teamName ? `, team ${b.teamName}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] text-mist">{new Date(b.awardedAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</span>
                </li>
              ))}
          </ul>
        )}
      </Card>
      <MyApplications />
      <MyTeams />
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-0.5">
      <span className="text-[11px] text-mist">{label}</span>
      <span className="break-words text-[14px]">{value || <span className="text-mist">Not set</span>}</span>
    </div>
  );
}

function TalentView({ t }: { t: TalentProfile }) {
  return (
    <div className="grid gap-5">
      <p className="text-[14px] leading-relaxed">{t.bio || <span className="text-mist">Add a short bio so companies know what you build and what you are looking for.</span>}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Detail label="Track" value={t.cat} />
        <Detail label="Availability" value={t.avail} />
        <Detail label="Project" value={t.project} />
        <Detail label="Portfolio" value={t.portfolio} />
        <Detail label="Contact" value={t.contact} />
        <Detail label="City" value={t.city} />
      </div>
      <div>
        <span className="text-[11px] text-mist">Skills</span>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {t.skills.length ? (
            t.skills.map((s) => (
              <span key={s} className="rounded-md bg-tint px-2 py-1 text-[12px] font-semibold text-sky">
                {s}
              </span>
            ))
          ) : (
            <span className="text-[13px] text-mist">No skills listed yet.</span>
          )}
        </div>
      </div>
    </div>
  );
}

function TalentForm({ t, onDone }: { t: TalentProfile; onDone: () => void }) {
  const [f, setF] = useState({
    name: t.name,
    cat: t.cat,
    city: t.city,
    age: t.age ? String(t.age) : "",
    avail: t.avail,
    contact: t.contact,
    portfolio: t.portfolio,
    project: t.project,
    bio: t.bio,
    skills: t.skills.join(", "),
  });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));
  const save = useAction(async () => {
    await api.users.updateMe({
      name: f.name.trim(),
      cat: f.cat,
      city: f.city.trim(),
      age: f.age ? Math.max(10, Math.min(99, Number(f.age))) : null,
      avail: f.avail,
      contact: f.contact.trim(),
      portfolio: f.portfolio.trim(),
      project: f.project.trim(),
      bio: f.bio.trim(),
      skills: f.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
    return true;
  });
  const toast = useToast();

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (await save.run()) {
      toast("Profile saved");
      onDone();
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name">
          <Input required value={f.name} onChange={set("name")} />
        </Field>
        <Field label="Track">
          <Select value={f.cat} onChange={set("cat")} options={categories.map((c) => c.name)} />
        </Field>
        <Field label="City">
          <Input value={f.city} onChange={set("city")} placeholder="Tashkent" />
        </Field>
        <Field label="Age">
          <Input type="number" min={10} max={99} value={f.age} onChange={set("age")} />
        </Field>
        <Field label="Availability">
          <Select value={f.avail} onChange={set("avail")} options={AVAIL.includes(f.avail) ? AVAIL : [f.avail, ...AVAIL]} />
        </Field>
        <Field label="Telegram or phone">
          <Input value={f.contact} onChange={set("contact")} placeholder="@username" />
        </Field>
        <Field label="Portfolio or GitHub">
          <Input value={f.portfolio} onChange={set("portfolio")} placeholder="github.com/you" />
        </Field>
        <Field label="Best project">
          <Input value={f.project} onChange={set("project")} placeholder="What you built at a hackathon" />
        </Field>
      </div>
      <Field label="Skills" hint="Comma separated, for example React, Figma, SQL.">
        <Input value={f.skills} onChange={set("skills")} />
      </Field>
      <Field label="Bio">
        <Textarea rows={4} value={f.bio} onChange={set("bio")} placeholder="What you build and what kind of opportunity you are looking for." />
      </Field>
      <ErrorNote>{save.error}</ErrorNote>
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={save.pending} className={`${btn.primary} disabled:opacity-60`}>
          {save.pending && <Spinner />} Save changes
        </button>
        <button type="button" onClick={onDone} className={btn.ghost}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function MyApplications() {
  const apps = useApi(() => api.opportunities.myApplications(), []);
  return (
    <Card>
      <SectionTitle>My applications</SectionTitle>
      {apps.loading ? (
        <Skeleton rows={2} className="h-16" />
      ) : apps.error ? (
        <ErrorNote>{apps.error}</ErrorNote>
      ) : !apps.data?.length ? (
        <Empty
          icon={<Briefcase size={20} />}
          title="No applications yet"
          text="Apply to internships and positions from Opportunities. Your profile is the application."
          action={
            <button onClick={() => go("#/app/opportunities")} className={btn.primary}>
              Browse opportunities
            </button>
          }
        />
      ) : (
        <ul className="divide-y divide-line">
          {apps.data.map((a) => (
            <li key={a.id} className="grid gap-1 py-3 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{a.opportunity.title}</span>
                  <span className="block text-[12px] text-mist">
                    {a.opportunity.company.name}, applied {ago(a.createdAt)}
                  </span>
                </span>
                <AppStatusPill status={a.status} />
              </div>
              {a.note && <p className="rounded-xl bg-paper/50 px-3 py-2 text-[12px] text-mist">Note from {a.opportunity.company.name}: {a.note}</p>}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function MyTeams() {
  const teams = useApi(() => api.hackathons.myTeams(), []);
  const events = useApi(() => api.hackathons.list(), []);
  const byId = new Map((events.data ?? []).map((h) => [h.id, h]));
  const rows = (teams.data ?? []).map((t) => ({ t, h: byId.get(t.hackathonId) })).filter((r) => r.h);
  return (
    <Card>
      <SectionTitle>My hackathon teams</SectionTitle>
      {teams.loading || events.loading ? (
        <Skeleton rows={2} className="h-16" />
      ) : teams.error ? (
        <ErrorNote>{teams.error}</ErrorNote>
      ) : !rows.length ? (
        <Empty
          icon={<Users size={20} />}
          title="No teams yet"
          text="Register a team for an upcoming Lumora hackathon. Results from events you join show up on your profile."
          action={
            <button onClick={() => go("#/app/hackathons")} className={btn.primary}>
              See hackathons
            </button>
          }
        />
      ) : (
        <ul className="divide-y divide-line">
          {rows.map(({ t, h }) => (
            <li key={t.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-tint text-sky">
                <CalendarDays size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{h!.title}</span>
                <span className="block truncate text-[12px] text-mist">
                  Team {t.teamName}
                  {t.track ? `, ${t.track}` : ""}, {when(h!.start, false)}
                </span>
              </span>
              <button onClick={() => go(`#/app/hackathons/${h!.id}`)} className={`${btn.sm} border border-line hover:bg-tint`}>
                Open
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ---------- company ---------- */

function CompanyHeader({ c }: { c: CompanyProfile }) {
  const statusPill =
    c.status === "approved" ? (
      <Pill tone="good">Approved</Pill>
    ) : c.status === "pending" ? (
      <span className="inline-flex items-center rounded-full bg-accent/15 px-2.5 py-1 text-[12px] font-semibold text-accent">Waiting for approval</span>
    ) : (
      <span className="inline-flex items-center rounded-full bg-bad/15 px-2.5 py-1 text-[12px] font-semibold text-[#ffb3b3]">Not approved</span>
    );
  return (
    <Card className="overflow-hidden p-0 md:p-0">
      <div className="h-24 bg-gradient-to-br from-blue to-paper" />
      <div className="-mt-10 px-5 pb-5 md:px-6 md:pb-6">
        <span className="inline-block rounded-full border-4 border-surface">
          <Avatar name={c.name} size={72} tone="paper" />
        </span>
        <h1 className="mt-3 text-[24px]">{c.name}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-mist">
          <span>{c.orgKind === "organization" ? "Organization" : "Company"}</span>
          <span>{c.industry}</span>
          {c.city && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} /> {c.city}
            </span>
          )}
          {c.size && <span>{c.size}</span>}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {statusPill}
          <Verified on={c.verified} />
          {c.partner && <Pill tone="blue">Lumora partner</Pill>}
        </div>
        {c.status === "rejected" && c.statusNote && <p className="mt-3 text-[12px] text-mist">Admin note: {c.statusNote}</p>}
        <div className="mt-5 flex flex-wrap gap-2">
          <button onClick={() => go("#/app/dashboard")} className={`${btn.sm} border border-line hover:bg-tint`}>
            <LayoutDashboard size={14} /> Dashboard
          </button>
          <button onClick={() => go("#/app/inbox")} className={`${btn.sm} border border-line hover:bg-tint`}>
            <MessageCircle size={14} /> Messages
          </button>
        </div>
      </div>
    </Card>
  );
}

function CompanyDetails({ c }: { c: CompanyProfile }) {
  const [editing, setEditing] = useState(false);
  return (
    <Card>
      <SectionTitle
        aside={
          !editing && (
            <button onClick={() => setEditing(true)} className={`${btn.sm} border border-line hover:bg-tint`}>
              <Pencil size={13} /> Edit profile
            </button>
          )
        }
      >
        {c.orgKind === "organization" ? "Organization" : "Company"}
      </SectionTitle>
      {editing ? (
        <CompanyForm c={c} onDone={() => setEditing(false)} />
      ) : (
        <div className="grid gap-5">
          {c.tagline && <p className="text-[15px]">{c.tagline}</p>}
          <p className="text-[14px] leading-relaxed text-mist">{c.about || "Tell talent what you build and what interns or juniors will work on."}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Detail label="Industry" value={c.industry} />
            <Detail label="Size" value={c.size} />
            <Detail label="City" value={c.city} />
            <Detail label="Website" value={c.website} />
            <Detail label="Contact" value={c.contact} />
          </div>
          <div>
            <span className="text-[11px] text-mist">Tags</span>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {c.tags.length ? (
                c.tags.map((s) => (
                  <span key={s} className="rounded-md bg-tint px-2 py-1 text-[12px] font-semibold text-sky">
                    {s}
                  </span>
                ))
              ) : (
                <span className="text-[13px] text-mist">No tags yet. Add your stack and work format.</span>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function CompanyForm({ c, onDone }: { c: CompanyProfile; onDone: () => void }) {
  const [f, setF] = useState({
    name: c.name,
    orgKind: c.orgKind,
    tagline: c.tagline,
    industry: c.industry,
    city: c.city,
    size: c.size,
    website: c.website,
    contact: c.contact,
    about: c.about,
    tags: c.tags.join(", "),
  });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));
  const save = useAction(async () => {
    await api.users.updateMe({
      name: f.name.trim(),
      orgKind: f.orgKind as OrgKind,
      tagline: f.tagline.trim(),
      industry: f.industry.trim(),
      city: f.city.trim(),
      size: f.size,
      website: f.website.trim(),
      contact: f.contact.trim(),
      about: f.about.trim(),
      tags: f.tags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
    return true;
  });
  const toast = useToast();

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (await save.run()) {
      toast("Profile saved");
      onDone();
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <Input required value={f.name} onChange={set("name")} />
        </Field>
        <Field label="Account kind">
          <Select
            value={f.orgKind}
            onChange={set("orgKind")}
            options={[
              { value: "company", label: "Company" },
              { value: "organization", label: "Organization" },
            ]}
          />
        </Field>
        <Field label="Tagline" className="sm:col-span-2">
          <Input value={f.tagline} onChange={set("tagline")} placeholder="School management software used by 400 schools" />
        </Field>
        <Field label="Industry">
          <Input value={f.industry} onChange={set("industry")} placeholder="EdTech" />
        </Field>
        <Field label="City">
          <Input value={f.city} onChange={set("city")} placeholder="Tashkent" />
        </Field>
        <Field label="Size">
          <Select value={f.size} onChange={set("size")} options={SIZES.includes(f.size) ? SIZES : [f.size, ...SIZES]} />
        </Field>
        <Field label="Website">
          <Input value={f.website} onChange={set("website")} placeholder="company.uz" />
        </Field>
        <Field label="Contact for candidates" className="sm:col-span-2">
          <Input value={f.contact} onChange={set("contact")} placeholder="hr@company.uz" />
        </Field>
      </div>
      <Field label="Tags" hint="Comma separated, for example React, Hybrid, Paid.">
        <Input value={f.tags} onChange={set("tags")} />
      </Field>
      <Field label="About">
        <Textarea rows={4} value={f.about} onChange={set("about")} />
      </Field>
      <ErrorNote>{save.error}</ErrorNote>
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={save.pending} className={`${btn.primary} disabled:opacity-60`}>
          {save.pending && <Spinner />} Save changes
        </button>
        <button type="button" onClick={onDone} className={btn.ghost}>
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ---------- account ---------- */

function AccountCard() {
  const user = useSession();
  const [confirm, setConfirm] = useState(false);
  const logout = useAction(async () => {
    await api.auth.logout();
    return true;
  });
  const reset = useAction(async () => {
    await api.auth.resetDemo();
    return true;
  });
  if (!user || user.kind === "admin") return null;
  const type = user.kind === "talent" ? "Talent" : user.orgKind === "organization" ? "Organization" : "Company";

  async function signOut() {
    if (await logout.run()) go("#/");
  }
  async function doReset() {
    if (await reset.run()) {
      setConfirm(false);
      go("#/login");
    }
  }

  return (
    <Card>
      <SectionTitle>Account</SectionTitle>
      <div className="grid gap-3">
        <Detail label="Email" value={user.email} />
        <Detail label="Account type" value={type} />
        <Detail label="Member since" value={new Date(user.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} />
      </div>
      <ErrorNote>{logout.error || reset.error}</ErrorNote>
      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={signOut} disabled={logout.pending} className={`${btn.sm} border border-line hover:bg-tint disabled:opacity-60`}>
          {logout.pending ? <Spinner /> : <LogOut size={14} />} Sign out
        </button>
        <button onClick={() => setConfirm(true)} className={`${btn.sm} border border-line text-mist hover:bg-tint hover:text-ink`}>
          <RotateCcw size={14} /> Reset demo data
        </button>
      </div>
      <Modal open={confirm} onClose={() => setConfirm(false)}>
        <div className="grid gap-4">
          <h2 className="text-[22px]">Reset demo data?</h2>
          <p className="text-[14px] text-mist">
            This restores all demo accounts, postings, matches and hackathons to their starting state and signs you out. It only affects this browser. Accounts you registered yourself will be removed.
          </p>
          <ErrorNote>{reset.error}</ErrorNote>
          <div className="flex flex-wrap gap-3">
            <button onClick={doReset} disabled={reset.pending} className={`${btn.primary} disabled:opacity-60`}>
              {reset.pending && <Spinner />} Reset and sign out
            </button>
            <button onClick={() => setConfirm(false)} className={btn.ghost}>
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
