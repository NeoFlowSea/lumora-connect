import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useLang } from "../../i18n";
import { Spinner } from "../../components/form";
import { btn } from "../../components/ui";

/* Building blocks of the profile page: sections, the draft, the save bar and list editors. */

export const sectionId = (key: string) => `profile-${key}`;

export function scrollToSection(key: string) {
  const el = document.getElementById(sectionId(key));
  if (!el) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  const focusable = el.querySelector<HTMLElement>("input, textarea, select, button");
  focusable?.focus({ preventScroll: true });
}

export function Section({ id, title, text, aside, children }: { id: string; title: string; text?: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section id={sectionId(id)} aria-labelledby={`${sectionId(id)}-h`} className="min-w-0 scroll-mt-24 rounded-xl border border-line bg-surface p-5 md:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={`${sectionId(id)}-h`} className="text-[18px] md:text-[20px]">
            {title}
          </h2>
          {text && <p className="mt-1 text-[14px] text-mist">{text}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

/**
 * Local edits on top of the saved profile. While nothing is edited, the draft follows
 * the saved data (for example after a save from another tab).
 */
export function useDraft<T>(base: T) {
  const baseJson = JSON.stringify(base);
  const [draft, setDraft] = useState<T>(base);
  const prev = useRef(baseJson);
  useEffect(() => {
    if (prev.current === baseJson) return;
    const old = prev.current;
    prev.current = baseJson;
    setDraft((d) => (JSON.stringify(d) === old ? (JSON.parse(baseJson) as T) : d));
  }, [baseJson]);
  const dirty = JSON.stringify(draft) !== baseJson;
  const set = <K extends keyof T>(k: K) => (v: T[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const reset = (to: T = JSON.parse(baseJson) as T) => setDraft(to);
  return { draft, set, setDraft, dirty, reset };
}

/** sticky bar with save and discard; sits above the phone tab bar */
export function SaveBar({ show, pending, error, onSave, onDiscard }: { show: boolean; pending: boolean; error: string | null; onSave: () => void; onDiscard: () => void }) {
  const { t } = useLang();
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={reduce ? { opacity: 0 } : { y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { y: 24, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t border-line bg-paper md:bottom-0"
          role="region"
          aria-label={t("profile.save.region")}
        >
          <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 md:px-8">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-medium text-ink">{t("profile.save.unsaved")}</p>
              {error && (
                <p role="alert" className="text-[13px] text-[#ffb3b3]">
                  {error}
                </p>
              )}
            </div>
            <button type="button" onClick={onDiscard} disabled={pending} className="min-h-11 rounded-lg px-3 text-[14px] font-semibold text-mist hover:text-ink">
              {t("profile.save.discard")}
            </button>
            <button type="button" onClick={onSave} disabled={pending} className={`${btn.primary} disabled:opacity-70`}>
              {pending && <Spinner />} {t("common.action.saveChanges")}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** a list of entries (experience, projects) with add, edit and remove, all inside the draft */
export function ListEditor<T extends { id: string }>({
  items,
  onChange,
  blank,
  valid,
  render,
  form,
  addLabel,
  emptyText,
}: {
  items: T[];
  onChange: (v: T[]) => void;
  blank: () => T;
  valid: (it: T) => boolean;
  render: (it: T) => ReactNode;
  form: (it: T, set: (v: T) => void) => ReactNode;
  addLabel: string;
  emptyText: string;
}) {
  const { t } = useLang();
  const [editing, setEditing] = useState<{ item: T; isNew: boolean } | null>(null);

  function commit() {
    if (!editing || !valid(editing.item)) return;
    onChange(editing.isNew ? [...items, editing.item] : items.map((x) => (x.id === editing.item.id ? editing.item : x)));
    setEditing(null);
  }

  const editor = editing && (
    <div className="grid gap-4 rounded-xl border border-sky/50 bg-paper/40 p-4">
      {form(editing.item, (v) => setEditing({ ...editing, item: v }))}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={commit} disabled={!valid(editing.item)} className={`${btn.secondary} disabled:opacity-50`}>
          {t("profile.list.done")}
        </button>
        <button type="button" onClick={() => setEditing(null)} className={btn.ghost}>
          {t("common.action.cancel")}
        </button>
      </div>
    </div>
  );

  return (
    <div className="grid gap-3">
      {items.length === 0 && !editing && <p className="text-[14px] text-mist">{emptyText}</p>}
      {items.length > 0 && (
        <ul className="grid gap-2">
          {items.map((it) =>
            editing && !editing.isNew && editing.item.id === it.id ? (
              <li key={it.id}>{editor}</li>
            ) : (
              <li key={it.id} className="flex items-start gap-3 rounded-lg border border-line bg-paper/30 p-3">
                <div className="min-w-0 flex-1">{render(it)}</div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => setEditing({ item: it, isNew: false })}
                    aria-label={t("common.action.edit")}
                    title={t("common.action.edit")}
                    className="grid h-11 w-11 place-items-center rounded-lg text-mist hover:bg-tint hover:text-ink"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(items.filter((x) => x.id !== it.id))}
                    aria-label={t("common.action.remove")}
                    title={t("common.action.remove")}
                    className="grid h-11 w-11 place-items-center rounded-lg text-mist hover:bg-tint hover:text-ink"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
      {editing?.isNew && editor}
      {!editing && (
        <button
          type="button"
          onClick={() => setEditing({ item: blank(), isNew: true })}
          className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg border border-dashed border-line px-4 text-[14px] font-semibold text-mist transition-colors hover:border-sky hover:text-ink"
        >
          <Plus size={16} /> {addLabel}
        </button>
      )}
    </div>
  );
}

/** small status tag */
export function Tag({ tone = "line", children }: { tone?: "line" | "good" | "bad" | "tint" | "accent"; children: ReactNode }) {
  const cls = {
    line: "border border-line text-mist",
    good: "bg-good/15 text-good",
    bad: "bg-bad/15 text-[#ffb3b3]",
    tint: "bg-tint text-sky",
    accent: "bg-accent/15 text-accent",
  }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[12px] font-medium ${cls}`}>{children}</span>;
}

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5">
      <span className="text-[12px] text-mist">{label}</span>
      <span className="break-words text-[15px]">{children}</span>
    </div>
  );
}
