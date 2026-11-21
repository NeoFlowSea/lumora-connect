import { useMemo, useState, type FormEvent } from "react";
import { AlertTriangle, BadgeCheck, Briefcase, Clock, EyeOff, Pencil, Plus, Trash2, Users, XCircle } from "lucide-react";
import { api, type ApplicationWithTalent, type OpportunityWithCompany } from "../api";
import { useAction, useApi, useSession } from "../api/hooks";
import type { ApplicationStatus, CompanyProfile, OpportunityInput, OpportunityType, TalentProfile } from "../api/types";
import { categories } from "../data";
import { Card, Chips, Empty, ErrorNote, Field, Input, Select, Skeleton, Spinner, Textarea, ago } from "../components/form";
import { Modal, Pill, btn, useToast } from "../components/ui";
import { go } from "../lib/router";
import { AppStatusPill, Avatar, BadgeRow, SectionTitle, Stat, UserInfoModal, Verified } from "./parts/common";

const TYPES: OpportunityType[] = ["Internship", "Work program", "Position", "Event"];
const typeTone: Record<OpportunityType, "blue" | "tint" | "line" | "good"> = {
  Internship: "blue",
  "Work program": "tint",
  Position: "good",
  Event: "line",
};

export function Dashboard() {
  const user = useSession();
  if (!user || user.kind !== "company") {
    return <Empty title="Dashboard is for company accounts" text="Sign in as a company or organization to manage postings and applicants." />;
  }
  return <CompanyDashboard company={user} />;
}

function CompanyDashboard({ company }: { company: CompanyProfile }) {
  const mine = useApi(() => api.opportunities.mine(), []);
  const applicants = useApi(() => api.opportunities.applicants(), []);
  const matches = useApi(() => api.swipe.matches(), []);
  const [editing, setEditing] = useState<OpportunityWithCompany | "new" | null>(null);
  const [removing, setRemoving] = useState<OpportunityWithCompany | null>(null);
  const approved = company.status === "approved";

  const apps = applicants.data ?? [];
  const countFor = (id: string) => apps.filter((a) => a.opportunityId === id).length;

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[clamp(26px,3vw,36px)]">Dashboard</h1>
          <p className="mt-1 text-[14px] text-mist">Postings, applicants and matches for {company.name}.</p>
        </div>
        <button
          onClick={() => setEditing("new")}
          disabled={!approved}
          title={approved ? undefined : "Available after an admin approves your company"}
          className={`${btn.primary} disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <Plus size={16} /> Post an opportunity
        </button>
      </div>

      <StatusCard company={company} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat value={mine.data ? mine.data.filter((o) => !o.hidden).length : "–"} label="Active postings" />
        <Stat value={applicants.data ? apps.length : "–"} label="Applicants" />
        <Stat value={applicants.data ? apps.filter((a) => a.status === "shortlisted").length : "–"} label="Shortlisted" />
        <Stat value={matches.data ? matches.data.length : "–"} label="Matches" />
      </div>

      <section>
        <SectionTitle>My postings</SectionTitle>
        {mine.loading ? (
          <Skeleton rows={2} />
        ) : mine.error ? (
          <ErrorNote>{mine.error}</ErrorNote>
        ) : !mine.data?.length ? (
          <Empty
            icon={<Briefcase size={20} />}
            title="No postings yet"
            text={approved ? "Post an internship, work program, position or event. It shows up in Opportunities for every talent right away." : "Once an admin approves your company you can publish postings here."}
            action={
              approved ? (
                <button onClick={() => setEditing("new")} className={btn.primary}>
                  <Plus size={16} /> Post an opportunity
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {mine.data.map((o) => (
              <Card key={o.id} className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone={typeTone[o.type]}>{o.type}</Pill>
                  <span className="text-[12px] text-mist">Posted {ago(o.postedAt)}</span>
                </div>
                <div>
                  <h3 className="text-[17px]">{o.title}</h3>
                  <p className="mt-1 text-[13px] text-mist">
                    {o.city}, {o.pay}
                  </p>
                </div>
                {o.hidden && (
                  <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-[12px] text-accent">
                    <EyeOff size={14} className="mt-0.5 shrink-0" />
                    <span>Hidden by a moderator{o.hiddenReason ? `: ${o.hiddenReason}` : "."} Talent cannot see it until it is restored.</span>
                  </div>
                )}
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="inline-flex items-center gap-1.5 text-[13px] text-mist">
                    <Users size={14} /> {countFor(o.id)} {countFor(o.id) === 1 ? "applicant" : "applicants"}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(o)} className={`${btn.sm} border border-line hover:bg-tint`}>
                      <Pencil size={13} /> Edit
                    </button>
                    <button onClick={() => setRemoving(o)} className={`${btn.sm} border border-line text-[#ffb3b3] hover:bg-bad/10`}>
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Applicants list={applicants.data} loading={applicants.loading} error={applicants.error} postings={mine.data ?? []} />

      <Modal open={!!editing} onClose={() => setEditing(null)} wide>
        {editing && <PostingForm initial={editing === "new" ? null : editing} onDone={() => setEditing(null)} />}
      </Modal>
      <RemoveModal posting={removing} onClose={() => setRemoving(null)} />
    </div>
  );
}

function StatusCard({ company }: { company: CompanyProfile }) {
  if (company.status === "approved") {
    return (
      <Card className="flex flex-wrap items-center gap-4">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-good/15 text-good">
          <BadgeCheck size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-semibold">Approved {company.orgKind === "organization" ? "organization" : "company"}</div>
          <p className="text-[13px] text-mist">
            You can swipe talent, publish postings and review applicants.{" "}
            {company.verified ? "Your verified mark shows on cards and postings." : "An admin can add a verified mark after checking your details."}
          </p>
        </div>
        <Verified on={company.verified} />
      </Card>
    );
  }
  if (company.status === "pending") {
    return (
      <Card className="flex flex-wrap items-start gap-4 border-accent/40">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-accent/15 text-accent">
          <Clock size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-semibold">Waiting for approval</div>
          <p className="mt-1 text-[13px] text-mist">
            A Lumora admin reviews every new company. After approval you can swipe verified talent, publish postings and see applicants. Meanwhile, complete your profile so the review goes faster.
          </p>
          <button onClick={() => go("#/app/profile")} className={`${btn.sm} mt-3 border border-line hover:bg-tint`}>
            Complete profile
          </button>
        </div>
      </Card>
    );
  }
  return (
    <Card className="flex flex-wrap items-start gap-4 border-bad/40">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-bad/15 text-[#ffb3b3]">
        <XCircle size={22} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-semibold">Not approved</div>
        <p className="mt-1 text-[13px] text-mist">{company.statusNote ? `Reason from the admin: ${company.statusNote}` : "An admin did not approve this account."}</p>
        <p className="mt-1 text-[13px] text-mist">Update your profile and contact the Lumora team to request another review.</p>
      </div>
    </Card>
  );
}

/* ---------- applicants ---------- */

const STATUS_FILTERS: { value: ApplicationStatus | ""; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Not selected" },
];

function Applicants({
  list,
  loading,
  error,
  postings,
}: {
  list: ApplicationWithTalent[] | undefined;
  loading: boolean;
  error: string | null;
  postings: OpportunityWithCompany[];
}) {
  const [posting, setPosting] = useState("");
  const [status, setStatus] = useState<ApplicationStatus | "">("");
  const [viewing, setViewing] = useState<TalentProfile | null>(null);
  const [rejecting, setRejecting] = useState<ApplicationWithTalent | null>(null);
  const toast = useToast();
  const act = useAction(async (id: string, s: ApplicationStatus) => {
    await api.opportunities.setStatus(id, s, "");
    return true;
  });

  const filtered = useMemo(
    () => (list ?? []).filter((a) => (!posting || a.opportunityId === posting) && (!status || a.status === status)),
    [list, posting, status],
  );

  async function set(a: ApplicationWithTalent, s: ApplicationStatus) {
    const ok = await act.run(a.id, s);
    if (ok) toast(s === "shortlisted" ? `${a.talent.name} shortlisted` : s === "accepted" ? `${a.talent.name} accepted` : "Status updated");
  }

  return (
    <section>
      <SectionTitle
        aside={
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <Select
              value={posting}
              onChange={(e) => setPosting(e.target.value)}
              options={[{ value: "", label: "All postings" }, ...postings.map((o) => ({ value: o.id, label: o.title }))]}
              className="min-w-0 flex-1 sm:w-56 sm:flex-none"
              aria-label="Filter by posting"
            />
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as ApplicationStatus | "")}
              options={STATUS_FILTERS}
              className="min-w-0 flex-1 sm:w-44 sm:flex-none"
              aria-label="Filter by status"
            />
          </div>
        }
      >
        Applicants
      </SectionTitle>
      <ErrorNote>{act.error}</ErrorNote>
      {loading ? (
        <Skeleton rows={3} />
      ) : error ? (
        <ErrorNote>{error}</ErrorNote>
      ) : !list?.length ? (
        <Empty icon={<Users size={20} />} title="No applicants yet" text="When talent applies to your postings they appear here, with their verified hackathon results." />
      ) : !filtered.length ? (
        <Empty title="Nothing matches these filters" text="Try another posting or status." />
      ) : (
        <div className="grid gap-3">
          {filtered.map((a) => (
            <Card key={a.id} className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
              <div className="flex min-w-0 gap-4">
                <Avatar name={a.talent.name} size={44} />
                <div className="min-w-0 grid gap-2">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-semibold">{a.talent.name}</span>
                    <Verified on={a.talent.verified} />
                    <AppStatusPill status={a.status} />
                  </div>
                  <div className="text-[12px] text-mist">
                    {a.talent.cat}, {a.talent.city}. Applied to <span className="text-ink">{a.opportunity.title}</span> {ago(a.createdAt)}
                  </div>
                  <BadgeRow badges={a.talent.badges} max={2} />
                  {a.talent.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {a.talent.skills.slice(0, 5).map((s) => (
                        <span key={s} className="rounded-md bg-tint px-2 py-0.5 text-[11px] font-semibold text-sky">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  {a.note && <div className="text-[12px] text-mist">Your note: {a.note}</div>}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 md:justify-end">
                <button onClick={() => setViewing(a.talent)} className={`${btn.sm} border border-line hover:bg-tint`}>
                  View profile
                </button>
                {a.status !== "shortlisted" && a.status !== "accepted" && (
                  <button disabled={act.pending} onClick={() => set(a, "shortlisted")} className={`${btn.sm} bg-blue text-white hover:bg-blue-deep disabled:opacity-60`}>
                    Shortlist
                  </button>
                )}
                {a.status !== "accepted" && (
                  <button disabled={act.pending} onClick={() => set(a, "accepted")} className={`${btn.sm} bg-accent text-paper hover:bg-accent-deep disabled:opacity-60`}>
                    Accept
                  </button>
                )}
                {a.status !== "rejected" && (
                  <button disabled={act.pending} onClick={() => setRejecting(a)} className={`${btn.sm} border border-line text-[#ffb3b3] hover:bg-bad/10 disabled:opacity-60`}>
                    Reject
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      <UserInfoModal user={viewing} onClose={() => setViewing(null)} />
      <RejectModal app={rejecting} onClose={() => setRejecting(null)} />
    </section>
  );
}

function RejectModal({ app, onClose }: { app: ApplicationWithTalent | null; onClose: () => void }) {
  const [note, setNote] = useState("");
  const act = useAction(async (id: string, n: string) => {
    await api.opportunities.setStatus(id, "rejected", n);
    return true;
  });
  const toast = useToast();
  async function submit() {
    if (!app) return;
    const ok = await act.run(app.id, note.trim());
    if (ok) {
      toast(`${app.talent.name} notified`);
      setNote("");
      onClose();
    }
  }
  return (
    <Modal open={!!app} onClose={onClose}>
      {app && (
        <div className="grid gap-4">
          <h2 className="text-[22px]">Reject {app.talent.name}?</h2>
          <p className="text-[14px] text-mist">They get a notification for {app.opportunity.title}. A short, kind note helps them improve. It is optional.</p>
          <Field label="Note to the applicant (optional)">
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="We went with someone with more React experience. Try our next round in spring." />
          </Field>
          <ErrorNote>{act.error}</ErrorNote>
          <div className="flex flex-wrap gap-3">
            <button onClick={submit} disabled={act.pending} className={`${btn.sm} bg-bad px-5 py-2.5 text-[14px] text-white hover:bg-bad/90 disabled:opacity-60`}>
              {act.pending && <Spinner />} Reject applicant
            </button>
            <button onClick={onClose} className={btn.ghost}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ---------- posting form ---------- */

function PostingForm({ initial, onDone }: { initial: OpportunityWithCompany | null; onDone: () => void }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [type, setType] = useState<OpportunityType>(initial?.type ?? "Internship");
  const [cats, setCats] = useState<string[]>(initial?.cats ?? []);
  const [city, setCity] = useState(initial?.city ?? "");
  const [dur, setDur] = useState(initial?.dur ?? "");
  const [pay, setPay] = useState(initial?.pay ?? "");
  const [desc, setDesc] = useState(initial?.desc ?? "");
  const [req, setReq] = useState((initial?.req ?? []).join("\n"));
  const toast = useToast();
  const create = useAction(api.opportunities.create);
  const update = useAction(async (id: string, patch: OpportunityInput) => {
    await api.opportunities.update(id, patch);
    return true;
  });
  const pending = create.pending || update.pending;
  const error = create.error || update.error;

  async function submit(e: FormEvent) {
    e.preventDefault();
    const input: OpportunityInput = {
      title: title.trim(),
      type,
      cats,
      city: city.trim() || "Tashkent",
      dur: dur.trim() || "To be agreed",
      pay: pay.trim() || "To be agreed",
      desc: desc.trim(),
      req: req
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      responsibilities: initial?.responsibilities ?? [],
      niceToHave: initial?.niceToHave ?? [],
      salaryMin: initial?.salaryMin ?? null,
      salaryMax: initial?.salaryMax ?? null,
      level: initial?.level ?? "intern",
      format: initial?.format ?? "onsite",
      schedule: initial?.schedule ?? "part-time",
      deadline: initial?.deadline ?? "",
      openings: initial?.openings ?? 1,
      perks: initial?.perks ?? [],
      questions: initial?.questions ?? [],
      closed: initial?.closed ?? false,
    };
    if (initial) {
      const ok = await update.run(initial.id, input);
      if (ok) {
        toast("Posting updated");
        onDone();
      }
    } else {
      const created = await create.run(input);
      if (created) {
        toast("Published. It is in Opportunities now");
        onDone();
      }
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <h2 className="text-[22px]">{initial ? "Edit posting" : "Post an opportunity"}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" className="sm:col-span-2">
          <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Frontend intern (React)" />
        </Field>
        <Field label="Type">
          <Select value={type} onChange={(e) => setType(e.target.value as OpportunityType)} options={TYPES} />
        </Field>
        <Field label="City or format">
          <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Tashkent, hybrid" />
        </Field>
        <Field label="Duration or date">
          <Input value={dur} onChange={(e) => setDur(e.target.value)} placeholder="8 weeks from 1 Dec" />
        </Field>
        <Field label="Compensation">
          <Input value={pay} onChange={(e) => setPay(e.target.value)} placeholder="2,000,000 UZS per month" />
        </Field>
      </div>
      <Field label="Tracks" hint="Talent in these tracks sees it first.">
        <Chips options={categories.map((c) => c.name)} value={cats} onChange={setCats} />
      </Field>
      <Field label="Description">
        <Textarea rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What the person will do and learn, who they work with." />
      </Field>
      <Field label="Requirements" hint="One per line.">
        <Textarea rows={3} value={req} onChange={(e) => setReq(e.target.value)} placeholder={"React basics\nGit\nPortfolio or Lumora project"} />
      </Field>
      <ErrorNote>{error}</ErrorNote>
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className={`${btn.primary} disabled:opacity-60`}>
          {pending && <Spinner />} {initial ? "Save changes" : "Publish"}
        </button>
        <button type="button" onClick={onDone} className={btn.ghost}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function RemoveModal({ posting, onClose }: { posting: OpportunityWithCompany | null; onClose: () => void }) {
  const act = useAction(async (id: string) => {
    await api.opportunities.remove(id);
    return true;
  });
  const toast = useToast();
  async function confirm() {
    if (!posting) return;
    const ok = await act.run(posting.id);
    if (ok) {
      toast("Posting removed");
      onClose();
    }
  }
  return (
    <Modal open={!!posting} onClose={onClose}>
      {posting && (
        <div className="grid gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-bad/15 text-[#ffb3b3]">
              <AlertTriangle size={18} />
            </span>
            <h2 className="text-[22px]">Remove this posting?</h2>
          </div>
          <p className="text-[14px] text-mist">
            {posting.title} disappears from Opportunities and its applications are deleted. This cannot be undone.
          </p>
          <ErrorNote>{act.error}</ErrorNote>
          <div className="flex flex-wrap gap-3">
            <button onClick={confirm} disabled={act.pending} className={`${btn.sm} bg-bad px-5 py-2.5 text-[14px] text-white hover:bg-bad/90 disabled:opacity-60`}>
              {act.pending && <Spinner />} Remove posting
            </button>
            <button onClick={onClose} className={btn.ghost}>
              Keep it
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
