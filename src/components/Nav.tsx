import { useEffect, useState } from "react";
import { Logo } from "./Logo";

const links = [
  { label: "Opportunities", href: "#opportunities" },
  { label: "Talent", href: "#talent" },
  { label: "How it works", href: "#how" },
  { label: "For companies", href: "#join" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-500 ${
        scrolled ? "border-b border-line bg-ink/70 backdrop-blur-xl" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-18 max-w-[1240px] items-center gap-8 px-5 md:px-8">
        <a href="#top" className="flex items-center gap-3">
          <Logo size={26} />
          <span className="whitespace-nowrap font-display text-[14px] font-medium tracking-tight md:text-[15px]">
            Lumora <span className="text-ice">Connect</span>
          </span>
        </a>
        <nav className="ml-8 hidden items-center gap-7 text-[14px] text-mist md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="transition-colors hover:text-snow">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <a href="#join" className="hidden text-[14px] text-mist transition-colors hover:text-snow sm:block">
            Sign in
          </a>
          <a
            href="#join"
            className="whitespace-nowrap rounded-full bg-snow px-4 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-ice md:text-[14px]"
          >
            Create profile
          </a>
        </div>
      </div>
    </header>
  );
}
