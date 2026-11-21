/* Talent page for signed-in users, #/app/talent/:id. Owned by the jobs agent (dict: jobs). */
import { useState } from "react";
import { ArrowLeft, Check, FileText, Github, Globe, GraduationCap, Heart, Linkedin, Lock, Mail, MapPin, MessageCircle, Pencil, SearchX, Send, Trophy, X } from "lucide-react";
import { api } from "../api";
import { useAction, useApi, useSession } from "../api/hooks";
import type { TalentProfile } from "../api/types";
import { Empty, ErrorNote, Skeleton, Spinner, ago } from "../components/form";
import { btn, useToast } from "../components/ui";
import { trackLabel, useLang } from "../i18n";
import { go } from "../lib/router";
import { Avatar, DemoTag, ExtLink, Tags, Verified } from "./parts/common";
import { Block, Dots } from "./jobs/bits";
import { dateText, formatLabel, href, proofLabel, shortUrl } from "./jobs/format";

function back(fallback: string) {
  if (window.history.length > 1) window.history.back();
  else go(fallback);
}

export function TalentPage({ id }: { id: string }) {
  const { t } = useLang();
  const user = useSession();
  const q = useApi(() => api.users.talent(id), [id]);
  const p = q.data;
  const fallback = user?.kind === "company" ? "#/app/swipe" : "#/app/profile";

  return (
    <div>
      <button onClick={() => back(fallback)} className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-[14px] font-medium text-mist hover:text-ink">
        <ArrowLeft size={16} /> {t("common.action.back")}
      </button>
      {q.loading && !p ? (
        <div className="mt-4">
          <Skeleton rows={3} className="h-40" />
        </div>
      ) : !p ? (
        <div className="mt-6">
          <Empty icon={<SearchX size={22} />} title={t("jobs.talent.notFound")} text={q.error ?? undefined} />
        </div>
      ) : (
        <TalentView p={p} />
      )}
    </div>
  );
}

function TalentView({ p }: { p: TalentProfile }) {
  const { t } = useLang();
  const user = useSession();
  const toast = useToast();
  const isCompany = user?.kind === "company";
  const self = user?.id === p.id;
  const matches = useApi(() => (isCompany ? api.swipe.matches() : Promise.resolve([])), [user?.id]);
  const liked = useApi(() => (isCompany ? api.swipe.liked() : Promise.resolve([])), [user?.id]);
  const [passed, setPassed] = useState(false);
  const swipe = useAction(async (dir: 1 | -1) => api.swipe.swipe(p.id, dir));

  const match = matches.data?.find((m) => m.talentId === p.id);
  const isLiked = !!liked.data?.some((u) => u.id === p.id);
  const canSeeContacts = self || user?.kind === "admin" || !!match;
  const approved = user?.kind === "company" && user.status === "approved";
  const edu = p.education;
  const v = p.verification;

  async function act(dir: 1 | -1) {
    const r = await swipe.run(dir);
    if (!r) return;
    if (dir === -1) {
      setPassed(true);
      toast(t("jobs.talent.passedToast"));
    } else toast(r.match ? t("jobs.company.matched") : t("jobs.talent.interestedToast"));
  }

  let actions = null;
  if (self) {
    actions = (
      <a href="#/app/profile" className={btn.secondary}>
        <Pencil size={15} /> {t("jobs.talent.edit")}
      </a>
    );
  } else if (isCompany) {
    actions = match ? (
      <button onClick={() => go(`#/app/inbox/${match.id}`)} className={btn.primary}>
        <MessageCircle size={16} /> {t("jobs.message")}
      </button>
    ) : isLiked ? (
      <span className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-tint px-4 text-[14px] font-semibold text-sky">
        <Check size={16} /> {t("jobs.company.youAreInterested")}
      </span>
    ) : passed ? (
      <span className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line px-4 text-[14px] text-mist">{t("jobs.talent.passed")}</span>
    ) : (
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => act(-1)} disabled={swipe.pending || !approved} className={`${btn.ghost} disabled:opacity-50`}>
          <X size={16} /> {t("jobs.swipe.pass")}
        </button>
        <button onClick={() => act(1)} disabled={swipe.pending || !approved} className={`${btn.primary} disabled:opacity-50`}>
          {swipe.pending ? <Spinner /> : <Heart size={16} />} {t("jobs.swipe.like")}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-8">
      <header className="rounded-xl border border-line bg-surface p-5 md:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-start">
          <Avatar name={p.name} src={p.photo} size={88} />
          <div className="min-w-0 flex-1">
            <h1 className="text-[clamp(24px,3vw,34px)]">{p.name}</h1>
            {p.headline && <p className="mt-1 text-[16px] text-ink/90">{p.headline}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              {v.level === "verified" ? (
                <span className="inline-flex flex-wrap items-center gap-x-1.5 text-[13px]">
                  <Verified on />
                  {v.proof && <span className="text-mist">{t("jobs.verifiedVia", { proof: proofLabel(v.proof) })}</span>}
                </span>
              ) : v.level === "pending" ? (
                <span className="text-[13px] text-mist">{t("jobs.talent.verifyPending")}</span>
              ) : (
                <Verified on={false} showOff />
              )}
              {p.demo && <DemoTag />}
            </div>
            <Dots
              className="mt-2 text-[14px] text-mist"
              parts={[
                trackLabel(p.cat),
                p.city ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={13} /> {p.city}
                  </span>
                ) : null,
                p.age ? t("jobs.talent.age", { n: p.age }) : null,
              ]}
            />
          </div>
          {actions && <div className="grid gap-2 md:w-[260px]">{actions}</div>}
        </div>
        {isCompany && !approved && !self && <p className="mt-4 text-[13px] text-mist">{t("jobs.talent.approvalNeeded")}</p>}
        {swipe.error && (
          <div className="mt-4">
            <ErrorNote>{swipe.error}</ErrorNote>
          </div>
        )}
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
        <div className="grid gap-8">
          {p.bio && (
            <Block title={t("jobs.talent.about")}>
              <p className="whitespace-pre-line text-[15px] leading-relaxed">{p.bio}</p>
            </Block>
          )}

          {p.skills.length > 0 && (
            <Block title={t("jobs.talent.skills")}>
              <Tags items={p.skills} />
            </Block>
          )}

          <Block title={t("jobs.talent.results")}>
            {p.badges.length ? (
              <ul className="grid gap-2">
                {p.badges
                  .slice()
                  .reverse()
                  .map((b) => (
                    <li key={b.id} className="flex items-start gap-3 rounded-xl border border-line bg-surface p-4">
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${b.place === 1 ? "bg-accent text-paper" : "bg-tint text-sky"}`}>
                        <Trophy size={18} />
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold">{b.title}</div>
                        <div className="text-[13px] text-mist">
                          {b.hackathonName}
                          {b.teamName ? `, ${t("jobs.talent.team", { name: b.teamName })}` : ""}
                          {b.awardedAt ? `, ${dateText(b.awardedAt)}` : ""}
                        </div>
                      </div>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-[14px] text-mist">{t("jobs.talent.noResults")}</p>
            )}
          </Block>

          {p.projects.length > 0 && (
            <Block title={t("jobs.talent.projects")}>
              <ul className="grid gap-3">
                {p.projects.map((x) => (
                  <li key={x.id} className="rounded-xl border border-line bg-surface p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <span className="font-semibold">{x.name}</span>
                      {x.event && <span className="rounded-md bg-tint px-2 py-0.5 text-[12px] font-semibold text-sky">{x.event}</span>}
                    </div>
                    {x.role && <div className="mt-0.5 text-[13px] text-mist">{x.role}</div>}
                    {x.desc && <p className="mt-2 text-[14px] leading-relaxed">{x.desc}</p>}
                    {x.url && (
                      <div className="mt-2 text-[13px]">
                        <ExtLink to={href("web", x.url)}>
                          <Globe size={13} /> {shortUrl(x.url)}
                        </ExtLink>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </Block>
          )}

          {p.experience.length > 0 && (
            <Block title={t("jobs.talent.experience")}>
              <ul className="grid gap-4 border-l border-line pl-5">
                {p.experience.map((x) => (
                  <li key={x.id} className="relative">
                    <span className="absolute -left-[25px] top-2 h-2 w-2 rounded-full bg-sky" aria-hidden />
                    <div className="font-semibold">{x.title}</div>
                    <div className="text-[13px] text-mist">{[x.org, x.period].filter(Boolean).join(", ")}</div>
                    {x.desc && <p className="mt-1 text-[14px] leading-relaxed">{x.desc}</p>}
                  </li>
                ))}
              </ul>
            </Block>
          )}
        </div>

        <aside className="grid gap-4">
          <section className="rounded-xl border border-line bg-surface p-5">
            <h2 className="text-[16px]">{t("jobs.talent.lookingFor")}</h2>
            <dl className="mt-3 grid gap-3 text-[14px]">
              <Item k={t("jobs.talent.roles")} v={p.roles.join(", ")} />
              <Item k={t("jobs.talent.formats")} v={p.workFormats.map(formatLabel).join(", ")} />
              <Item k={t("jobs.talent.stipend")} v={p.expectedStipend} />
              <Item k={t("jobs.talent.availability")} v={p.avail} />
            </dl>
          </section>

          {(edu.institution || p.languages.length > 0) && (
            <section className="rounded-xl border border-line bg-surface p-5">
              <h2 className="text-[16px]">{t("jobs.talent.education")}</h2>
              {edu.institution && (
                <div className="mt-3 flex gap-3 text-[14px]">
                  <GraduationCap size={18} className="mt-0.5 shrink-0 text-sky" />
                  <div className="min-w-0">
                    <div className="font-medium">{edu.institution}</div>
                    <div className="text-[13px] text-mist">{[edu.program, edu.year].filter(Boolean).join(", ")}</div>
                  </div>
                </div>
              )}
              {p.languages.length > 0 && (
                <dl className="mt-3 grid text-[14px]">
                  <Item k={t("jobs.talent.languages")} v={p.languages.join(", ")} />
                </dl>
              )}
            </section>
          )}

          {(p.github || p.portfolio || p.linkedin || p.cv) && (
            <section className="rounded-xl border border-line bg-surface p-5">
              <h2 className="text-[16px]">{t("jobs.talent.links")}</h2>
              <ul className="mt-3 grid gap-2 text-[14px]">
                {p.github && (
                  <li>
                    <ExtLink to={href("github", p.github)}>
                      <Github size={14} /> {shortUrl(p.github)}
                    </ExtLink>
                  </li>
                )}
                {p.portfolio && p.portfolio !== p.github && (
                  <li>
                    <ExtLink to={href("web", p.portfolio)}>
                      <Globe size={14} /> {shortUrl(p.portfolio)}
                    </ExtLink>
                  </li>
                )}
                {p.linkedin && (
                  <li>
                    <ExtLink to={href("linkedin", p.linkedin)}>
                      <Linkedin size={14} /> {shortUrl(p.linkedin)}
                    </ExtLink>
                  </li>
                )}
              </ul>
              {p.cv && (
                <a href={p.cv.dataUrl} download={p.cv.name} className={`${btn.secondary} mt-4 w-full`}>
                  <FileText size={15} /> {t("jobs.talent.downloadCv")}
                </a>
              )}
            </section>
          )}

          <section className="rounded-xl border border-line bg-surface p-5">
            <h2 className="text-[16px]">{t("jobs.talent.contacts")}</h2>
            {canSeeContacts ? (
              <ul className="mt-3 grid gap-2 text-[14px]">
                <li className="flex items-center gap-2 break-all">
                  <Mail size={14} className="shrink-0 text-mist" /> {p.email}
                </li>
                {p.contact && (
                  <li className="flex items-center gap-2 break-all">
                    <Send size={14} className="shrink-0 text-mist" /> {p.contact}
                  </li>
                )}
                {match && <li className="text-[12px] text-mist">{t("jobs.talent.matchedAgo", { when: ago(match.at) })}</li>}
              </ul>
            ) : (
              <p className="mt-3 flex items-start gap-2 text-[14px] text-mist">
                <Lock size={15} className="mt-0.5 shrink-0" /> {t("jobs.talent.matchToSee")}
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  if (!v) return null;
  return (
    <div className="grid gap-0.5">
      <dt className="text-[12px] text-mist">{k}</dt>
      <dd className="m-0 break-words">{v}</dd>
    </div>
  );
}
