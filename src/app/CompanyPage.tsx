/* Public company page, #/company/:id. Owned by the jobs agent (dict: jobs). */
import { Briefcase, Building2, CalendarDays, Check, Globe, Linkedin, ThumbsUp, MapPin, MessageCircle, Pencil, SearchX, Send, Users } from "lucide-react";
import { api } from "../api";
import { useAction, useApi, useSession } from "../api/hooks";
import { Empty, ErrorNote, Skeleton, Spinner } from "../components/form";
import { Pill, btn, useToast } from "../components/ui";
import { useLang } from "../i18n";
import { go } from "../lib/router";
import { openApp } from "../pages/PublicFrame";
import { Avatar, DemoTag, Tags, Verified } from "./parts/common";
import { BackLink, Block, Bullets, Dots, PageWrap } from "./jobs/bits";
import { JobCard } from "./jobs/JobCard";
import { href, proofLabel, shortUrl } from "./jobs/format";

export function CompanyPage({ id }: { id: string }) {
  const { t } = useLang();
  const user = useSession();
  const toast = useToast();
  const q = useApi(() => api.users.company(id), [id]);
  const isTalent = user?.kind === "talent";
  const liked = useApi(() => (isTalent ? api.swipe.liked() : Promise.resolve([])), [user?.id]);
  const matches = useApi(() => (isTalent ? api.swipe.matches() : Promise.resolve([])), [user?.id]);
  const like = useAction(async () => api.swipe.swipe(id, 1));

  const c = q.data?.company;
  const openings = q.data?.openings ?? [];
  const match = matches.data?.find((m) => m.companyId === id);
  const isLiked = !!liked.data?.some((u) => u.id === id);
  const own = user?.kind === "company" && user.id === id;

  async function interested() {
    const r = await like.run();
    if (!r) return;
    if (r.match) toast(t("jobs.company.matched"));
    else toast(t("jobs.company.interestedToast"));
  }

  let action = null;
  if (own) {
    action = (
      <a href="#/app/profile" className={btn.secondary}>
        <Pencil size={15} /> {t("jobs.company.editProfile")}
      </a>
    );
  } else if (!user) {
    action = (
      <button onClick={() => openApp(`#/company/${id}`)} className={btn.primary}>
        <ThumbsUp size={16} /> {t("jobs.company.interested")}
      </button>
    );
  } else if (isTalent) {
    action = match ? (
      <button onClick={() => go(`#/app/inbox/${match.id}`)} className={btn.primary}>
        <MessageCircle size={16} /> {t("jobs.message")}
      </button>
    ) : isLiked ? (
      <span className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-tint px-4 text-[14px] font-semibold text-sky">
        <Check size={16} /> {t("jobs.company.youAreInterested")}
      </span>
    ) : (
      <button onClick={interested} disabled={like.pending} className={`${btn.primary} disabled:opacity-60`}>
        {like.pending ? <Spinner /> : <ThumbsUp size={16} />} {t("jobs.company.interested")}
      </button>
    );
  }

  return (
    <PageWrap>
      <BackLink to="#/jobs" label={t("jobs.backToJobs")} />
      {q.loading && !q.data ? (
        <div className="mt-4">
          <Skeleton rows={3} className="h-40" />
        </div>
      ) : !c ? (
        <div className="mt-6">
          <Empty
            icon={<SearchX size={22} />}
            title={t("jobs.company.notFound")}
            text={t("jobs.company.notFoundText")}
            action={
              <a href="#/jobs" className={btn.primary}>
                {t("jobs.job.browse")}
              </a>
            }
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-8">
          <header className="rounded-xl border border-line bg-surface p-5 md:p-7">
            <div className="flex flex-col gap-5 md:flex-row md:items-start">
              <Avatar name={c.name} src={c.logo} size={72} shape="square" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-[clamp(24px,3vw,34px)]">{c.name}</h1>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Verified on={c.verified} proof={proofLabel(c.verification.proof)} />
                  {c.partner && <Pill tone="blue">{t("jobs.company.partner")}</Pill>}
                  {c.demo && <DemoTag />}
                  {c.status !== "approved" && <Pill tone="line">{t("common.status.pending")}</Pill>}
                </div>
                <Dots
                  className="mt-2 text-[14px] text-mist"
                  parts={[
                    t(c.orgKind === "organization" ? "jobs.company.org" : "jobs.company.company"),
                    c.industry,
                    c.city ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={13} /> {c.city}
                      </span>
                    ) : null,
                    c.size ? (
                      <span className="inline-flex items-center gap-1">
                        <Users size={13} /> {c.size}
                      </span>
                    ) : null,
                    c.foundedYear ? (
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={13} /> {t("jobs.company.foundedIn", { year: c.foundedYear })}
                      </span>
                    ) : null,
                  ]}
                />
                {c.tagline && <p className="mt-3 max-w-[64ch] text-[16px] leading-relaxed">{c.tagline}</p>}
                <div className="mt-4 flex flex-wrap gap-2">
                  {c.website && (
                    <a href={href("web", c.website)} target="_blank" rel="noreferrer noopener" className={`${btn.sm} min-h-11 border border-line text-ink hover:bg-tint`}>
                      <Globe size={14} /> {shortUrl(c.website)}
                    </a>
                  )}
                  {c.telegram && (
                    <a href={href("telegram", c.telegram)} target="_blank" rel="noreferrer noopener" className={`${btn.sm} min-h-11 border border-line text-ink hover:bg-tint`}>
                      <Send size={14} /> {c.telegram}
                    </a>
                  )}
                  {c.linkedin && (
                    <a href={href("linkedin", c.linkedin)} target="_blank" rel="noreferrer noopener" className={`${btn.sm} min-h-11 border border-line text-ink hover:bg-tint`}>
                      <Linkedin size={14} /> LinkedIn
                    </a>
                  )}
                </div>
              </div>
              {action && (
                <div className="grid gap-2 md:w-[220px] md:justify-items-stretch">
                  {action}
                  {isTalent && !match && <p className="text-[12px] text-mist">{t("jobs.company.interestedHint")}</p>}
                  {!user && <p className="text-[12px] text-mist">{t("jobs.company.signInHint")}</p>}
                </div>
              )}
            </div>
            {like.error && (
              <div className="mt-4">
                <ErrorNote>{like.error}</ErrorNote>
              </div>
            )}
          </header>

          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
            <div className="grid gap-8">
              {c.about && (
                <Block title={t("jobs.company.about")}>
                  <p className="whitespace-pre-line text-[15px] leading-relaxed">{c.about}</p>
                </Block>
              )}
              <Block title={`${t("jobs.company.openings")} · ${openings.length}`}>
                {openings.length ? (
                  <ul className="grid gap-3">
                    {openings.map((o) => (
                      <li key={o.id}>
                        <JobCard o={{ ...o, company: c }} showCompany={false} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Empty icon={<Briefcase size={20} />} title={t("jobs.company.noOpenings")} text={t("jobs.company.noOpeningsText")} />
                )}
              </Block>
            </div>
            <aside className="grid gap-4">
              {c.benefits.length > 0 && (
                <section className="rounded-xl border border-line bg-surface p-5">
                  <h2 className="text-[16px]">{t("jobs.company.benefits")}</h2>
                  <div className="mt-3">
                    <Bullets items={c.benefits} />
                  </div>
                </section>
              )}
              {c.tags.length > 0 && (
                <section className="rounded-xl border border-line bg-surface p-5">
                  <h2 className="text-[16px]">{t("jobs.company.stack")}</h2>
                  <div className="mt-3">
                    <Tags items={c.tags} />
                  </div>
                </section>
              )}
              <section className="rounded-xl bg-tint p-5 text-[14px] leading-relaxed">
                <div className="flex items-center gap-2 font-semibold">
                  <Building2 size={16} className="text-sky" /> {t("jobs.company.howTitle")}
                </div>
                <p className="mt-2 text-ink/85">{t("jobs.company.howText")}</p>
              </section>
            </aside>
          </div>
        </div>
      )}
    </PageWrap>
  );
}
