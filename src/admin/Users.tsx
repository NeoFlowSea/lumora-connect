import { useEffect, useMemo, useState } from "react";
import { Award, BadgeCheck, ChevronDown, Search, ShieldCheck, Trash2, Trophy, UserPlus } from "lucide-react";
import { api, type UserFilter } from "../api";
import { useAction, useApi, useSession } from "../api/hooks";
import type { AdminLevel, AdminProfile, TalentProfile, User } from "../api/types";
import { Card, Empty, ErrorNote, Field, Input, Select, Skeleton, Spinner, ago } from "../components/form";
import { Modal, Pill, btn, initials, useToast } from "../components/ui";
import { AdminHeader } from "./AdminShell";

const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

const roleLabel = (u: User) =>
  u.kind === "talent" ? "Talent" : u.kind === "company" ? (u.orgKind === "organization" ? "Organization" : "Company") : u.level === "super" ? "Super admin" : "Moderator";

export function Users() {
  const me = useSession() as AdminProfile | null;
  const isSuper = me?.level === "super";
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [role, setRole] = useState<UserFilter["role"]>("");
  const [status, setStatus] = useState<UserFilter["status"]>("");
  const [awarding, setAwarding] = useState<TalentProfile | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const list = useApi(() => api.admin.users({ q: debounced, role, status }), [debounced, role, status]);

  return (
    <div>
      <AdminHeader title="Users" text="Search people and companies, verify accounts and award hackathon winner badges." />

      {!isSuper && (
        <div className="mb-5 flex items-start gap-2 rounded-2xl border border-line bg-tint px-4 py-3 text-[13px] text-sky">
          <ShieldCheck size={16} className="mt-0.5 shrink-0" />
          Moderators can review and verify but cannot delete or manage admins.
        </div>
      )}

      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px_200px]">
        <label className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email" className="pl-9" aria-label="Search users" />
        </label>
        <Select
          aria-label="Role"
          value={role}
          onChange={(e) => setRole(e.target.value as UserFilter["role"])}
          options={[
            { value: "", label: "All roles" },
            { value: "talent", label: "Talent" },
            { value: "company", label: "Companies" },
            { value: "admin", label: "Admins" },
          ]}
        />
        <Select
          aria-label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as UserFilter["status"])}
          options={[
            { value: "", label: "Any status" },
            { value: "verified", label: "Verified" },
            { value: "unverified", label: "Unverified" },
            { value: "pending", label: "Pending approval" },
            { value: "approved", label: "Approved" },
            { value: "rejected", label: "Rejected" },
          ]}
        />
      </div>

      <ErrorNote>{list.error}</ErrorNote>
      {list.loading ? (
        <Skeleton rows={5} className="h-16" />
      ) : !list.data?.length ? (
        <Empty icon={<Search size={20} />} title="Nobody matches" text="Try another name, or clear the role and status filters." />
      ) : (
        <>
          <p className="mb-2 text-[12px] text-mist">{list.data.length} accounts</p>
          <Card className="p-0 md:p-0">
            <ul className="divide-y divide-line">
              {list.data.map((u) => (
                <UserRow
                  key={u.id}
                  u={u}
                  isSuper={isSuper}
                  isMe={u.id === me?.id}
                  onAward={() => setAwarding(u as TalentProfile)}
                  onDelete={() => setDeleting(u)}
                />
              ))}
            </ul>
          </Card>
        </>
      )}

      {isSuper && <AdminsBlock meId={me!.id} />}

      <AwardModal talent={awarding} onClose={() => setAwarding(null)} />
      <DeleteModal user={deleting} onClose={() => setDeleting(null)} />
    </div>
  );
}

function UserRow({
  u,
  isSuper,
  isMe,
  onAward,
  onDelete,
}: {
  u: User;
  isSuper: boolean;
  isMe: boolean;
  onAward: () => void;
  onDelete: () => void;
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const verify = useAction(async (v: boolean) => {
    await api.admin.setVerified(u.id, v);
    return true as const;
  });
  const revoke = useAction(async (badgeId: string) => {
    await api.admin.revokeBadge(u.id, badgeId);
    return true as const;
  });
  const verified = u.kind !== "admin" && u.verified;
  const badges = u.kind === "talent" ? u.badges : [];

  return (
    <li className="px-4 py-3 md:px-5">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-[13px] font-semibold ${
              u.kind === "admin" ? "bg-accent text-paper" : u.kind === "company" ? "bg-blue text-white" : "bg-tint text-sky"
            }`}
          >
            {initials(u.name)}
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-[14px] font-semibold">{u.name}</span>
              {verified && <BadgeCheck size={15} className="shrink-0 text-accent" aria-label="Verified" />}
              {isMe && <span className="text-[11px] text-mist">(you)</span>}
            </span>
            <span className="block truncate text-[12px] text-mist">{u.email}</span>
          </span>
          <ChevronDown size={16} className={`ml-auto shrink-0 text-mist transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={u.kind === "admin" ? "blue" : "line"}>{roleLabel(u)}</Pill>
          {u.kind === "company" && u.status !== "approved" && <Pill tone="tint">{u.status === "pending" ? "Pending" : "Rejected"}</Pill>}
          {u.kind === "talent" && (
            <span className="flex items-center gap-1 text-[12px] text-mist" title="Badges">
              <Trophy size={13} /> {badges.length}
            </span>
          )}
        </div>
      </div>

      {open && (
        <div className="mt-3 grid gap-3 rounded-2xl bg-paper/50 p-4">
          <div className="grid gap-1 text-[12px] text-mist sm:grid-cols-2">
            <span>Joined {ago(u.createdAt)}</span>
            {u.kind === "talent" && (
              <span>
                {u.cat}, {u.city || "no city"}
                {u.contact ? `, ${u.contact}` : ""}
              </span>
            )}
            {u.kind === "company" && (
              <span>
                {u.industry || "no industry"}, {u.city || "no city"}
              </span>
            )}
          </div>

          {u.kind === "talent" && (
            <div>
              <div className="mb-2 text-[12px] font-semibold text-mist">Badges</div>
              {badges.length === 0 ? (
                <p className="text-[13px] text-mist">No badges yet.</p>
              ) : (
                <ul className="grid gap-2">
                  {badges.map((b) => (
                    <li key={b.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-tint px-3 py-2 text-[13px]">
                      <Trophy size={14} className="text-accent" />
                      <span className="min-w-0 flex-1">
                        <b>{b.title}</b>, {b.hackathonName}
                        {b.teamName ? <span className="text-mist">, team {b.teamName}</span> : null}
                      </span>
                      {isSuper && (
                        <button
                          disabled={revoke.pending}
                          onClick={async () => {
                            if (await revoke.run(b.id)) toast("Badge revoked");
                          }}
                          className="text-[12px] font-semibold text-bad hover:underline disabled:opacity-60"
                        >
                          Revoke
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {u.kind !== "admin" && (
              <button
                disabled={verify.pending}
                onClick={async () => {
                  const was = verified;
                  if (await verify.run(!was)) toast(was ? `${u.name} unverified` : `${u.name} verified`);
                }}
                className={`${btn.sm} border border-line hover:bg-tint disabled:opacity-60`}
              >
                {verify.pending ? <Spinner /> : <BadgeCheck size={15} />} {verified ? "Unverify" : "Verify"}
              </button>
            )}
            {u.kind === "talent" && (
              <button onClick={onAward} className={`${btn.sm} bg-accent text-paper hover:bg-accent-deep`}>
                <Award size={15} /> Award badge
              </button>
            )}
            {isSuper && !isMe && (
              <button onClick={onDelete} className={`${btn.sm} border border-line text-bad hover:border-bad`}>
                <Trash2 size={15} /> Delete account
              </button>
            )}
          </div>
          <ErrorNote>{verify.error || revoke.error}</ErrorNote>
        </div>
      )}
    </li>
  );
}

function AwardModal({ talent, onClose }: { talent: TalentProfile | null; onClose: () => void }) {
  const toast = useToast();
  const events = useApi(() => api.hackathons.list({ includeDrafts: true }), []);
  const [eventId, setEventId] = useState("");
  const [place, setPlace] = useState("1");
  const [title, setTitle] = useState("1st place");
  const [titleTouched, setTitleTouched] = useState(false);
  const [team, setTeam] = useState("");
  const award = useAction(async () => {
    await api.admin.awardBadge(talent!.id, {
      hackathonId: eventId,
      place: place ? Number(place) : null,
      title,
      teamName: team.trim() || undefined,
    });
    return true as const;
  });

  const event = events.data?.find((e) => e.id === eventId);
  const placeOptions = useMemo(() => {
    const n = Math.max(event?.places.length ?? 3, 3);
    return [{ value: "", label: "No place (nomination or finalist)" }, ...Array.from({ length: n }, (_, i) => ({ value: String(i + 1), label: ordinal(i + 1) }))];
  }, [event]);

  useEffect(() => {
    if (talent) {
      setEventId("");
      setPlace("1");
      setTitle("1st place");
      setTitleTouched(false);
      setTeam("");
      award.setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [talent]);

  useEffect(() => {
    if (!eventId && events.data?.length) setEventId(events.data[0].id);
  }, [events.data, eventId]);

  // prefill the title from the event's own place titles until the admin edits it
  useEffect(() => {
    if (titleTouched) return;
    if (!place) {
      setTitle("Finalist");
      return;
    }
    const n = Number(place);
    setTitle(event?.places.find((p) => p.place === n)?.title ?? `${ordinal(n)} place`);
  }, [place, event, titleTouched]);

  return (
    <Modal open={!!talent} onClose={onClose}>
      {talent && (
        <form
          className="grid gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await award.run()) {
              toast(`Badge awarded to ${talent.name}`);
              onClose();
            }
          }}
        >
          <h2 className="text-[22px]">Award a badge</h2>
          <p className="text-[13px] text-mist">
            {talent.name} gets a notification, and the badge shows on their swipe card and profile.
          </p>
          <Field label="Event">
            {events.loading ? (
              <Skeleton rows={1} className="h-10" />
            ) : (
              <Select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                options={(events.data ?? []).map((h) => ({ value: h.id, label: `${h.title}${h.status === "draft" ? " (draft)" : ""}` }))}
              />
            )}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Place">
              <Select value={place} onChange={(e) => setPlace(e.target.value)} options={placeOptions} />
            </Field>
            <Field label="Badge title" hint="Shown on the badge, for example 1st place or Best design">
              <Input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setTitleTouched(true);
                }}
              />
            </Field>
          </div>
          <Field label="Team name" hint="Optional">
            <Input value={team} onChange={(e) => setTeam(e.target.value)} placeholder="Night Owls" />
          </Field>
          <ErrorNote>{award.error}</ErrorNote>
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={award.pending || !eventId} className={`${btn.primary} disabled:opacity-60`}>
              {award.pending ? <Spinner /> : <Award size={16} />} Award badge
            </button>
            <button type="button" onClick={onClose} className={btn.ghost}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function DeleteModal({ user, onClose }: { user: User | null; onClose: () => void }) {
  const toast = useToast();
  const del = useAction(async (id: string) => {
    await api.admin.deleteUser(id);
    return true as const;
  });
  return (
    <Modal open={!!user} onClose={onClose}>
      {user && (
        <div className="grid gap-4">
          <h2 className="text-[22px]">Delete {user.name}?</h2>
          <p className="text-[13px] leading-relaxed text-mist">
            This removes the account, its sign-in, swipes, applications, postings and team registrations. It cannot be undone, except by
            resetting the demo data.
          </p>
          <ErrorNote>{del.error}</ErrorNote>
          <div className="flex flex-wrap gap-3">
            <button
              disabled={del.pending}
              onClick={async () => {
                if (await del.run(user.id)) {
                  toast(`${user.name} deleted`);
                  onClose();
                }
              }}
              className={`${btn.sm} bg-bad px-5 py-2.5 text-white hover:bg-bad/90 disabled:opacity-60`}
            >
              {del.pending ? <Spinner /> : <Trash2 size={15} />} Delete account
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

function AdminsBlock({ meId }: { meId: string }) {
  const toast = useToast();
  const admins = useApi(() => api.admin.users({ role: "admin" }), []);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [level, setLevel] = useState<AdminLevel>("moderator");
  const create = useAction(async () => {
    await api.admin.createAdmin({ name, email, password, level });
    return true as const;
  });

  return (
    <Card className="mt-8">
      <div className="flex items-center gap-2">
        <ShieldCheck size={18} className="text-accent" />
        <h2 className="text-[17px]">Admins</h2>
      </div>
      <p className="mt-1 text-[13px] text-mist">Only super admins see this block. Moderators review and verify; super admins can also delete and manage admins.</p>

      {admins.loading ? (
        <div className="mt-4">
          <Skeleton rows={2} className="h-12" />
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {(admins.data ?? [])
            .filter((u): u is AdminProfile => u.kind === "admin")
            .map((a) => (
              <AdminRow key={a.id} a={a} isMe={a.id === meId} />
            ))}
        </ul>
      )}

      <form
        className="mt-6 grid gap-4 rounded-2xl border border-line p-4 md:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await create.run()) {
            toast(`${name} added as ${level === "super" ? "super admin" : "moderator"}`);
            setName("");
            setEmail("");
            setPassword("");
          }
        }}
      >
        <div className="flex items-center gap-2 md:col-span-2">
          <UserPlus size={16} className="text-sky" />
          <span className="text-[14px] font-semibold">Add an admin</span>
        </div>
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nodira Saidova" />
        </Field>
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nodira@lumora.uz" />
        </Field>
        <Field label="Password" hint="At least 8 characters">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        </Field>
        <Field label="Level">
          <Select
            value={level}
            onChange={(e) => setLevel(e.target.value as AdminLevel)}
            options={[
              { value: "moderator", label: "Moderator" },
              { value: "super", label: "Super admin" },
            ]}
          />
        </Field>
        <div className="md:col-span-2">
          <ErrorNote>{create.error}</ErrorNote>
        </div>
        <div className="md:col-span-2">
          <button type="submit" disabled={create.pending} className={`${btn.primary} disabled:opacity-60`}>
            {create.pending ? <Spinner /> : <UserPlus size={16} />} Add admin
          </button>
        </div>
      </form>
    </Card>
  );
}

function AdminRow({ a, isMe }: { a: AdminProfile; isMe: boolean }) {
  const toast = useToast();
  const change = useAction(async (lvl: AdminLevel) => {
    await api.admin.setAdminLevel(a.id, lvl);
    return true as const;
  });
  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-[12px] font-semibold text-paper">{initials(a.name)}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold">
          {a.name} {isMe && <span className="text-[11px] font-normal text-mist">(you)</span>}
        </span>
        <span className="block truncate text-[12px] text-mist">{a.email}</span>
      </span>
      {isMe ? (
        <Pill tone="blue">{a.level === "super" ? "Super admin" : "Moderator"}</Pill>
      ) : (
        <div className="flex items-center gap-2">
          {change.pending && <Spinner />}
          <Select
            aria-label={`Level for ${a.name}`}
            value={a.level}
            disabled={change.pending}
            onChange={async (e) => {
              const lvl = e.target.value as AdminLevel;
              if (await change.run(lvl)) toast(`${a.name} is now ${lvl === "super" ? "a super admin" : "a moderator"}`);
            }}
            className="w-auto py-1.5 text-[13px]"
            options={[
              { value: "moderator", label: "Moderator" },
              { value: "super", label: "Super admin" },
            ]}
          />
        </div>
      )}
      {change.error && (
        <div className="w-full">
          <ErrorNote>{change.error}</ErrorNote>
        </div>
      )}
    </li>
  );
}
