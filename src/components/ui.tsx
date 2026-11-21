import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

export const ease = [0.22, 1, 0.36, 1] as const;

/* Fade-and-rise once the element scrolls into view. */
export function Reveal({
  children,
  delay = 0,
  className = "",
  y = 24,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: 0.7, ease, delay }}
    >
      {children}
    </motion.div>
  );
}

/* A marker sweep behind a phrase, drawn when it scrolls into view. */
export function Highlight({ children, delay = 0.2 }: { children: ReactNode; delay?: number }) {
  return (
    <span className="relative inline-block">
      <motion.span
        aria-hidden
        className="absolute inset-x-0 bottom-[-0.02em] h-[0.14em] rounded-full bg-accent"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ duration: 0.6, ease, delay }}
        style={{ transformOrigin: "left" }}
      />
      {children}
    </span>
  );
}

export const btn = {
  /* orange: only the one main action on a screen */
  primary:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-[15px] font-semibold text-paper transition-colors hover:bg-accent-deep active:translate-y-px",
  /* blue: secondary actions */
  secondary:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue px-5 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#3470ea] active:translate-y-px",
  ghost:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-transparent px-5 py-2.5 text-[15px] font-semibold text-ink transition-colors hover:border-sky hover:bg-tint",
  sm: "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-semibold",
};

/* Toasts */
type Toast = { id: number; text: string };
const ToastCtx = createContext<(text: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { id, text }]);
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 2400);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[90] flex flex-col items-center gap-2 px-4 md:bottom-8">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.3, ease }}
              className="rounded-lg bg-ink px-4 py-2.5 text-[14px] font-semibold text-paper shadow-lg"
            >
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

/* Modal */
export function Modal({ open, onClose, children, wide }: { open: boolean; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] grid place-items-end bg-[#050d24]/70 p-0 backdrop-blur-sm md:place-items-center md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease }}
            className={`max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-surface p-6 shadow-2xl md:rounded-2xl md:p-8 ${wide ? "md:max-w-[760px]" : "md:max-w-[560px]"}`}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Pill({ children, tone = "tint" }: { children: ReactNode; tone?: "tint" | "blue" | "line" | "good" }) {
  const cls = {
    tint: "bg-tint text-sky",
    blue: "bg-blue text-white",
    line: "border border-line text-mist",
    good: "bg-good/15 text-good",
  }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[12px] font-medium ${cls}`}>{children}</span>;
}

export const initials = (n: string) =>
  n
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
