/* Layout bits shared by the jobs, company and talent pages. */
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { useSession } from "../../api/hooks";
import { useLang } from "../../i18n";

/** true when the page sits inside the app shell (signed-in talent or company), which already pads the content */
export function useInShell() {
  const user = useSession();
  return !!user && user.kind !== "admin";
}

/** Public pages get their own container; inside the app shell the shell provides it. */
export function PageWrap({ children }: { children: ReactNode }) {
  const inShell = useInShell();
  if (inShell) return <>{children}</>;
  return <div className="mx-auto w-full max-w-[1240px] px-4 pb-20 pt-6 sm:px-5 md:px-8 md:pt-10">{children}</div>;
}

export function BackLink({ to, label }: { to: string; label?: string }) {
  const { t } = useLang();
  return (
    <a href={to} className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-[14px] font-medium text-mist hover:text-ink">
      <ArrowLeft size={16} /> {label ?? t("common.action.back")}
    </a>
  );
}

export function useMedia(query: string) {
  const [on, setOn] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const m = window.matchMedia(query);
    const fn = () => setOn(m.matches);
    fn();
    m.addEventListener("change", fn);
    return () => m.removeEventListener("change", fn);
  }, [query]);
  return on;
}

/** a titled block on the detail pages */
export function Block({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={className}>
      <h2 className="text-[17px] md:text-[18px]">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-2 text-[15px] leading-relaxed">
      {items.map((r, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-sky" aria-hidden />
          <span className="min-w-0">{r}</span>
        </li>
      ))}
    </ul>
  );
}

/** label and value in the facts grid */
export function Fact({ label, children, strong }: { label: string; children: ReactNode; strong?: boolean }) {
  return (
    <div className="min-w-0 rounded-lg bg-paper/50 px-3 py-2.5">
      <div className="text-[12px] text-mist">{label}</div>
      <div className={`mt-0.5 break-words text-[14px] ${strong ? "font-semibold text-ink" : ""}`}>{children}</div>
    </div>
  );
}

/** "A · B · C" with soft separators, skipping empty parts */
export function Dots({ parts, className = "" }: { parts: ReactNode[]; className?: string }) {
  const list = parts.filter(Boolean);
  return (
    <span className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 ${className}`}>
      {list.map((p, i) => (
        <span key={i} className="inline-flex items-center gap-2">
          {i > 0 && <span className="h-1 w-1 rounded-full bg-mist/50" aria-hidden />}
          {p}
        </span>
      ))}
    </span>
  );
}
