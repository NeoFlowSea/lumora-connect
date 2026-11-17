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
  primary:
    "inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-[15px] font-semibold text-paper shadow-[0_10px_30px_-12px_rgba(255,201,60,0.55)] transition-[background-color,transform,box-shadow] hover:bg-accent-deep hover:shadow-[0_14px_34px_-12px_rgba(255,201,60,0.7)] active:scale-[0.98]",
  ghost:
    "inline-flex items-center justify-center gap-2 rounded-full border border-line bg-transparent px-6 py-3 text-[15px] font-semibold text-ink transition-colors hover:border-sky hover:bg-tint",
  sm: "inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold",
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
              className="rounded-full bg-accent px-4 py-2.5 text-[14px] font-semibold text-paper shadow-lg"
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
            className={`max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-surface p-6 shadow-2xl md:rounded-3xl md:p-8 ${wide ? "md:max-w-[760px]" : "md:max-w-[560px]"}`}
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
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold ${cls}`}>{children}</span>;
}

export const initials = (n: string) =>
  n
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
