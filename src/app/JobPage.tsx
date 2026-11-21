/* Full opportunity page, #/jobs/:id. Owned by the jobs agent (dict: jobs). */
import { SearchX } from "lucide-react";
import { api } from "../api";
import { useApi } from "../api/hooks";
import { Empty, Skeleton } from "../components/form";
import { btn } from "../components/ui";
import { useLang } from "../i18n";
import { ApplyBox } from "./jobs/Apply";
import { BackLink, PageWrap, useInShell } from "./jobs/bits";
import { JobBody } from "./jobs/JobBody";

export function JobPage({ id }: { id: string }) {
  const { t } = useLang();
  const inShell = useInShell();
  const q = useApi(() => api.opportunities.get(id), [id]);
  const o = q.data;

  return (
    <PageWrap>
      <BackLink to="#/jobs" label={t("jobs.backToJobs")} />
      {q.loading && !o ? (
        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Skeleton rows={3} className="h-40" />
          <Skeleton rows={1} className="hidden h-56 lg:block" />
        </div>
      ) : !o ? (
        <div className="mt-6">
          <Empty
            icon={<SearchX size={22} />}
            title={t("jobs.job.notFound")}
            text={t("jobs.job.notFoundText")}
            action={
              <a href="#/jobs" className={btn.primary}>
                {t("jobs.job.browse")}
              </a>
            }
          />
        </div>
      ) : (
        <>
          <div className="mt-4 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
            <JobBody o={o} />
            <aside className="hidden lg:sticky lg:top-24 lg:block">
              <div className="rounded-xl border border-line bg-surface p-5">
                <ApplyBox key={o.id} o={o} />
              </div>
            </aside>
          </div>
          {/* phones and tablets: the apply bar stays in reach, above the tab bar when there is one */}
          <div className="h-24 lg:hidden" aria-hidden />
          <div
            className={`fixed inset-x-0 z-30 border-t border-line bg-paper px-4 py-3 lg:hidden ${
              inShell ? "bottom-[calc(57px+env(safe-area-inset-bottom))] md:bottom-0" : "bottom-0 pb-[calc(12px+env(safe-area-inset-bottom))]"
            }`}
          >
            <div className="mx-auto max-w-[720px]">
              <ApplyBox key={o.id} o={o} variant="bar" />
            </div>
          </div>
        </>
      )}
    </PageWrap>
  );
}
