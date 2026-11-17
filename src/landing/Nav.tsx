import { useEffect, useState } from "react";
import { Wordmark } from "../components/Logo";

const links = [
  { label: "How it works", href: "#how" },
  { label: "Opportunities", href: "#opportunities" },
  { label: "Talent", href: "#talent" },
  { label: "Hackathons", href: "#hackathons" },
];

export function Nav({ onOpenApp }: { onOpenApp: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,box-shadow] duration-500 ${
        scrolled ? "border-b border-line bg-paper/80 shadow-[0_8px_30px_-20px_rgba(11,31,58,0.3)] backdrop-blur-xl" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-18 max-w-[1240px] items-center gap-8 px-5 md:px-8">
        <a href="#top" aria-label="Lumora Connect">
          <Wordmark />
        </a>
        <nav className="ml-6 hidden items-center gap-7 text-[14px] text-mist md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={(e) => {
                e.preventDefault();
                document.querySelector(l.href)?.scrollIntoView({ behavior: "smooth" });
              }}
              className="transition-colors hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <button onClick={onOpenApp} className="hidden text-[14px] font-semibold text-mist transition-colors hover:text-ink sm:block">
            Sign in
          </button>
          <button
            onClick={onOpenApp}
            className="whitespace-nowrap rounded-full bg-accent px-4 py-2 text-[13px] font-semibold text-paper transition-colors hover:bg-accent-deep md:text-[14px]"
          >
            Open the app
          </button>
        </div>
      </div>
    </header>
  );
}
