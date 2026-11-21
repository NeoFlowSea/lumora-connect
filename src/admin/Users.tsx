import { useEffect, useMemo, useState } from "react";
import { Award, BadgeCheck, ChevronDown, ExternalLink, Search, ShieldCheck, Trash2, Trophy, UserPlus } from "lucide-react";
import { api, type UserFilter } from "../api";
import { useAction, useApi, useSession } from "../api/hooks";
import type { AdminLevel, AdminProfile, CompanyStatus, TalentProfile, User, VerificationLevel } from "../api/types";
import { Card, Empty, ErrorNote, Field, Input, Select, Skeleton, Spinner, ago } from "../components/form";
import { Modal, Pill, btn, useToast } from "../components/ui";
import { locale, t, trackLabel } from "../i18n";
import { placeTitle } from "../app/HackathonsTab";
import { Avatar } from "../app/parts/common";
import { AdminHeader } from "./AdminShell";
import { ordinal } from "./events/shared";

const rowBtn = `${btn.sm} min-h-11 md:min-h-9`;

const roleLabel = (u: User) =>
  t(
    u.kind === "talent"
      ? "admin.kind.talent"
      : u.kind === "company"
        ? u.orgKind === "organization"
          ? "admin.kind.organization"
          : "admin.kind.company"
        : u.level === "super"
          ? "admin.level.super"
          : "admin.level.moderator",
  );

const levelOf = (u: User): VerificationLevel | null => (u.kind === "admin" ? null : u.verification.level);

function LevelPill({ level }: { level: VerificationLevel }) {
  if (level === "verified")
    return (
      <Pill tone="good">
        <BadgeCheck size={12} /> {t("common.status.verified")}
      </Pill>
    );
  if (level === "pending") return <Pill tone="tint">{t("admin.users.levelPending")}</Pill>;
  return <Pill tone="line">{t("common.status.unverified")}</Pill>;
}

type Level = "" | VerificationLevel;
type Account = "" | "real" | "demo";
type Setup = "" | "notOnboarded" | "emailUnconfirmed" | "ready";

export function Users() {
  const me = useSession() as AdminProfile | null;
  const isSuper = me?.level === "super";
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [role, setRole] = useState<UserFilter["role"]>("");
  const [companyStatus, setCompanyStatus] = useState<"" | CompanyStatus>("");
  const [level, setLevel] = useState<Level>("");
  const [account, setAccount] = useState<Account>("");
  const [setup, setSetup] = useState<Setup>("");
  const [awarding, setAwarding] = useState<TalentProfile | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(id);
  }, [q]);

  const status = role === "company" ? companyStatus : "";
  const list = useApi(() => api.admin.users({ q: debounced, role, status }), [debounced, role, status]);

  const rows = useMemo(
    () =>
      (list.data ?? []).filter((u) => {
        if (level && levelOf(u) !== level) return false;
        if (account && (u.kind === "admin" || (account === "demo") !== u.demo)) return false;
        if (setup) {
          if (u.kind === "admin") return false;
          if (setup === "notOnboarded" && u.onboarded) return false;
          if (setup === "emailUnconfirmed" && u.emailConfirmed) return false;
          if (setup === "ready" && !(u.onboarded && u.emailConfirmed)) return false;
        }
        return true;
      }),
    [list.data, level, account, setup],
  );
  const filtered = !!(debounced || role || status || level || account || setup);

  function clear() {
    setQ("");
    setRole("");
    setCompanyStatus("");
    setLevel("");
    setAccount("");
    setSetup("");
  }

  return (
    <div>
      <AdminHeader title={t("admin.users.title")} text={t("admin.users.lead")} />

      {!isSuper && (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-line bg-tint px-4 py-3 text-[13px] text-sky">
          <ShieldCheck size={16} className="mt-0.5 shrink-0" />
          {t("admin.users.moderatorNote")}
        </div>
      )}

      <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))]">
        <label className="relative sm:col-span-2 lg:col-span-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("admin.users.search")} className="pl-9" aria-label={t("admin.users.search")} />
        </label>
        <Select
          aria-label={t("admin.users.role")}
          value={role}
          onChange={(e) => setRole(e.target.value as UserFilter["role"])}
          options={[
            { value: "", label: t("admin.users.allRoles") },
            { value: "talent", label: t("admin.users.roleTalent") },
            { value: "company", label: t("admin.users.roleCompany") },
            { value: "admin", label: t("admin.users.roleAdmin") },
          ]}
        />
        <Select
          aria-label={t("admin.users.verification")}
          value={level}
          onChange={(e) => setLevel(e.target.value as Level)}
          options={[
            { value: "", label: t("admin.users.anyVerification") },
            { value: "verified", label: t("common.status.verified") },
            { value: "pending", label: t("admin.users.levelPending") },
            { value: "unverified", label: t("common.status.unverified") },
          ]}
        />
        <Select
          aria-label={t("admin.users.account")}
          value={account}
          onChange={(e) => setAccount(e.target.value as Account)}
          options={[
            { value: "", label: t("admin.users.anyAccount") },
            { value: "real", label: t("admin.users.real") },
            { value: "demo", label: t("admin.users.demo") },
          ]}
        />
        <Select
          aria-label={t("admin.users.setup")}
          value={setup}
          onChange={(e) => setSetup(e.target.value as Setup)}
          options={[
            { value: "", label: t("admin.users.anySetup") },
            { value: "ready", label: t("admin.users.setupReady") },
            { value: "notOnboarded", label: t("admin.users.notOnboarded") },
            { value: "emailUnconfirmed", label: t("admin.users.emailUnconfirmed") },
          ]}
        />
        {role === "company" && (
          <Select
            aria-label={t("admin.users.companyStatus")}
            value={companyStatus}
            onChange={(e) => setCompanyStatus(e.target.value as "" | CompanyStatus)}
            options={[
              { value: "", label: t("admin.users.anyStatus") },
              { value: "pending", label: t("common.status.pending") },
              { value: "approved", label: t("common.status.approved") },
              { value: "rejected", label: t("common.status.rejected") },
            ]}
          />
        )}
      </div>

      <ErrorNote>{list.error}</ErrorNote>
      {list.loading ? (
        <Skeleton rows={5} className="h-16" />
      ) : !rows.length ? (
        <Empty
          icon={<Search size={20} />}
          title={t("admin.users.noneTitle")}
          text={t("admin.users.noneText")}
          action={
            filtered ? (
              <button onClick={clear} className={btn.ghost}>
                {t("common.action.clearFilters")}
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[13px] text-mist">{t("admin.users.count", { n: rows.length.toLocaleString(locale()) })}</p>
            {filtered && (
              <button onClick={clear} className="min-h-11 text-[13px] font-semibold text-sky hover:underline md:min-h-0">
                {t("common.action.clearFilters")}
              </button>
            )}
          </div>
          <Card className="p-0 md:p-0">
            <ul className="divide-y divide-line">
              {rows.map((u) => (
                <UserRow key={u.id} u={u} isSuper={isSuper} isMe={u.id === me?.id} onAward={() => setAwarding(u as TalentProfile)} onDelete={() => setDeleting(u)} />
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

function UserRow({ u, isSuper, isMe, onAward, onDelete }: { u: User; isSuper: boolean; isMe: boolean; onAward: () => void; onDelete: () => void }) {
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
  const level = levelOf(u);
  const badges = u.kind === "talent" ? u.badges : [];

  return (
    <li className="min-w-0 px-3 py-2 md:px-5">
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex min-h-11 min-w-0 flex-1 basis-[220px] items-center gap-3 text-left">
          <Avatar name={u.name} size={40} tone={u.kind === "admin" ? "accent" : u.kind === "company" ? "paper" : "blue"} />
          <span className="min-w-0 flex-1">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="min-w-0 truncate text-[14px] font-semibold">{u.name}</span>
              {isMe && <span className="shrink-0 text-[12px] text-mist">{t("admin.users.you")}</span>}
            </span>
            <span className="block truncate text-[12px] text-mist">{u.email}</span>
          </span>
          <ChevronDown size={16} className={`shrink-0 text-mist transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
        </button>
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <Pill tone={u.kind === "admin" ? "blue" : "line"}>{roleLabel(u)}</Pill>
          {level && <LevelPill level={level} />}
          {u.kind === "company" && u.status !== "approved" && <Pill tone="tint">{t(`common.status.${u.status}`)}</Pill>}
          {u.kind !== "admin" && u.demo && <Pill tone="line">{t("common.status.demo")}</Pill>}
          {u.kind !== "admin" && !u.onboarded && <Pill tone="line">{t("admin.users.notOnboardedShort")}</Pill>}
          {u.kind !== "admin" && !u.emailConfirmed && <Pill tone="line">{t("admin.users.emailShort")}</Pill>}
          {u.kind === "talent" && badges.length > 0 && (
            <span className="flex items-center gap-1 text-[12px] text-mist" title={t("admin.users.badges")}>
              <Trophy size={13} /> {badges.length}
            </span>
          )}
        </div>
      </div>

      {open && (
        <div className="mb-2 mt-2 grid gap-3 rounded-lg bg-paper/50 p-3 md:p-4">
          <dl className="grid gap-x-6 gap-y-1.5 text-[13px] sm:grid-cols-2">
            <Fact k={t("admin.users.joined")} v={`${ago(u.createdAt)}`} />
            {u.kind === "talent" && <Fact k={t("admin.users.details")} v={[trackLabel(u.cat), u.city, u.contact].filter(Boolean).join(", ")} />}
            {u.kind === "company" && <Fact k={t("admin.users.details")} v={[u.industry, u.city, u.website].filter(Boolean).join(", ")} />}
            {u.kind !== "admin" && (
              <>
                <Fact k={t("admin.users.onboarding")} v={t(u.onboarded ? "admin.users.done" : "admin.users.notYet")} />
                <Fact k={t("admin.users.email")} v={t(u.emailConfirmed ? "admin.users.confirmed" : "admin.users.notConfirmed")} />
                <Fact
                  k={t("admin.users.verification")}
                  v={[t(`admin.proof.${u.verification.proof || "none"}`), u.verification.proofValue, u.verification.reviewedAt ? ago(u.verification.reviewedAt) : ""].filter(Boolean).join(", ")}
                />
                {u.verification.note && <Fact k={t("admin.users.reviewNote")} v={u.verification.note} />}
              </>
            )}
          </dl>

          {u.kind === "company" && (
            <a href={`#/company/${u.id}`} className="inline-flex min-h-11 w-fit items-center gap-1 text-[13px] font-semibold text-sky hover:underline md:min-h-0">
              {t("admin.companies.openPage")} <ExternalLink size={12} />
            </a>
          )}

          {u.kind === "talent" && (
            <div>
              <div className="mb-2 text-[12px] font-semibold text-mist">{t("admin.users.badges")}</div>
              {badges.length === 0 ? (
                <p className="text-[13px] text-mist">{t("admin.users.noBadges")}</p>
              ) : (
                <ul className="grid gap-2">
                  {badges.map((b) => (
                    <li key={b.id} className="flex min-w-0 flex-wrap items-center gap-2 rounded-lg bg-tint px-3 py-2 text-[13px]">
                      <Trophy size={14} className="shrink-0 text-accent" />
                      <span className="min-w-0 flex-1 break-words">
                        <b>{placeTitle(b.title)}</b>, {b.hackathonName}
                        {b.teamName ? <span className="text-mist">, {t("admin.users.team", { name: b.teamName })}</span> : null}
                      </span>
                      {isSuper && (
                        <button
                          disabled={revoke.pending}
                          onClick={async () => {
                            if (await revoke.run(b.id)) toast(t("admin.users.revokedToast"));
                          }}
                          className="min-h-11 px-1 text-[13px] font-semibold text-[#ffb3b3] hover:underline disabled:opacity-60 md:min-h-0"
                        >
                          {t("admin.users.revoke")}
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
                  if (await verify.run(!was)) toast(t(was ? "admin.users.unverifiedToast" : "admin.users.verifiedToast", { name: u.name }));
                }}
                className={`${rowBtn} border border-line hover:bg-tint disabled:opacity-60`}
              >
                {verify.pending ? <Spinner /> : <BadgeCheck size={15} />} {t(verified ? "admin.users.unverify" : "admin.users.verify")}
              </button>
            )}
            {u.kind === "talent" && (
              <button onClick={onAward} className={`${rowBtn} bg-blue text-white hover:bg-blue-deep`}>
                <Award size={15} /> {t("admin.users.award")}
              </button>
            )}
            {isSuper && !isMe && (
              <button onClick={onDelete} className={`${rowBtn} border border-line text-[#ffb3b3] hover:border-bad`}>
                <Trash2 size={15} /> {t("admin.users.delete")}
              </button>
            )}
          </div>
          <ErrorNote>{verify.error || revoke.error}</ErrorNote>
        </div>
      )}
    </li>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  if (!v) return null;
  return (
    <div className="min-w-0">
      <dt className="inline text-mist">{k}: </dt>
      <dd className="inline break-words">{v}</dd>
    </div>
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

  /* real rounds keep their real podium team names, so sample people never get a badge from them */
  const options = (events.data ?? []).filter((h) => h.demo || h.status !== "finished" || !h.podium.length);
  const event = options.find((e) => e.id === eventId);
  const placeOptions = useMemo(() => {
    const n = Math.max(event?.places.length ?? 3, 3);
    return [{ value: "", label: t("admin.award.noPlace") }, ...Array.from({ length: n }, (_, i) => ({ value: String(i + 1), label: t("app.hack.placeN", { n: i + 1 }) }))];
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
    if (!eventId && options.length) setEventId(options[0].id);
  }, [options, eventId]);

  // prefill the title from the event's own place titles until the admin edits it. Stored in English so every language can translate it.
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
              toast(t("admin.award.toast", { name: talent.name }));
              onClose();
            }
          }}
        >
          <h2 className="text-[22px]">{t("admin.award.title")}</h2>
          <p className="text-[14px] text-mist">{t("admin.award.text", { name: talent.name })}</p>
          <Field label={t("admin.award.event")} hint={t("admin.award.eventHint")}>
            {events.loading ? (
              <Skeleton rows={1} className="h-11" />
            ) : (
              <Select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                options={options.map((h) => ({ value: h.id, label: `${h.title}${h.status === "draft" ? ` (${t("admin.award.draft")})` : ""}` }))}
              />
            )}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("admin.award.place")}>
              <Select value={place} onChange={(e) => setPlace(e.target.value)} options={placeOptions} />
            </Field>
            <Field label={t("admin.award.badgeTitle")} hint={t("admin.award.badgeTitleHint")}>
              <Input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setTitleTouched(true);
                }}
              />
            </Field>
          </div>
          <Field label={t("admin.award.team")} hint={t("admin.optional")}>
            <Input value={team} onChange={(e) => setTeam(e.target.value)} placeholder="Night Owls" />
          </Field>
          <ErrorNote>{award.error}</ErrorNote>
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={award.pending || !eventId} className={`${btn.primary} disabled:opacity-60`}>
              {award.pending ? <Spinner /> : <Award size={16} />} {t("admin.users.award")}
            </button>
            <button type="button" onClick={onClose} className={btn.ghost}>
              {t("common.action.cancel")}
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
          <h2 className="break-words text-[22px]">{t("admin.users.deleteTitle", { name: user.name })}</h2>
          <p className="text-[14px] leading-relaxed text-mist">{t("admin.users.deleteText")}</p>
          <ErrorNote>{del.error}</ErrorNote>
          <div className="flex flex-wrap gap-3">
            <button
              disabled={del.pending}
              onClick={async () => {
                if (await del.run(user.id)) {
                  toast(t("admin.users.deletedToast", { name: user.name }));
                  onClose();
                }
              }}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-bad px-5 text-[15px] font-semibold text-white hover:bg-bad/90 disabled:opacity-60"
            >
              {del.pending ? <Spinner /> : <Trash2 size={15} />} {t("admin.users.delete")}
            </button>
            <button onClick={onClose} className={btn.ghost}>
              {t("common.action.cancel")}
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
  const levelOptions = [
    { value: "moderator", label: t("admin.level.moderator") },
    { value: "super", label: t("admin.level.super") },
  ];

  return (
    <Card className="mt-8">
      <div className="flex items-center gap-2">
        <ShieldCheck size={18} className="text-sky" />
        <h2 className="text-[17px]">{t("admin.admins.title")}</h2>
      </div>
      <p className="mt-1 text-[13px] text-mist">{t("admin.admins.lead")}</p>

      {admins.loading ? (
        <div className="mt-4">
          <Skeleton rows={2} className="h-12" />
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {(admins.data ?? [])
            .filter((u): u is AdminProfile => u.kind === "admin")
            .map((a) => (
              <AdminRow key={a.id} a={a} isMe={a.id === meId} levelOptions={levelOptions} />
            ))}
        </ul>
      )}

      <form
        className="mt-6 grid gap-4 rounded-lg border border-line p-4 md:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await create.run()) {
            toast(t("admin.admins.added", { name }));
            setName("");
            setEmail("");
            setPassword("");
          }
        }}
      >
        <div className="flex items-center gap-2 md:col-span-2">
          <UserPlus size={16} className="text-sky" />
          <span className="text-[14px] font-semibold">{t("admin.admins.add")}</span>
        </div>
        <Field label={t("admin.admins.name")}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nodira Saidova" />
        </Field>
        <Field label={t("admin.users.email")}>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nodira@lumora.uz" />
        </Field>
        <Field label={t("admin.admins.password")} hint={t("admin.admins.passwordHint")}>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        </Field>
        <Field label={t("admin.admins.level")}>
          <Select value={level} onChange={(e) => setLevel(e.target.value as AdminLevel)} options={levelOptions} />
        </Field>
        <div className="md:col-span-2">
          <ErrorNote>{create.error}</ErrorNote>
        </div>
        <div className="md:col-span-2">
          <button type="submit" disabled={create.pending} className={`${btn.secondary} disabled:opacity-60`}>
            {create.pending ? <Spinner /> : <UserPlus size={16} />} {t("admin.admins.addSubmit")}
          </button>
        </div>
      </form>
    </Card>
  );
}

function AdminRow({ a, isMe, levelOptions }: { a: AdminProfile; isMe: boolean; levelOptions: { value: string; label: string }[] }) {
  const toast = useToast();
  const change = useAction(async (lvl: AdminLevel) => {
    await api.admin.setAdminLevel(a.id, lvl);
    return true as const;
  });
  return (
    <li className="flex min-w-0 flex-wrap items-center gap-3 py-3">
      <Avatar name={a.name} size={36} tone="accent" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-semibold">
          {a.name} {isMe && <span className="text-[12px] font-normal text-mist">{t("admin.users.you")}</span>}
        </span>
        <span className="block truncate text-[12px] text-mist">{a.email}</span>
      </span>
      {isMe ? (
        <Pill tone="blue">{t(a.level === "super" ? "admin.level.super" : "admin.level.moderator")}</Pill>
      ) : (
        <div className="flex items-center gap-2">
          {change.pending && <Spinner />}
          <Select
            aria-label={t("admin.admins.levelFor", { name: a.name })}
            value={a.level}
            disabled={change.pending}
            onChange={async (e) => {
              const lvl = e.target.value as AdminLevel;
              if (await change.run(lvl)) toast(t(lvl === "super" ? "admin.admins.nowSuper" : "admin.admins.nowModerator", { name: a.name }));
            }}
            className="w-auto"
            options={levelOptions}
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
