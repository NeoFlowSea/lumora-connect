import type { ReactNode } from "react";
import { Building2, Check, ExternalLink, GraduationCap, Instagram, Linkedin, Send } from "lucide-react";
import { LogoTile } from "../components/Logo";
import { locale, useLang } from "../i18n";
import { lumora, photo, teamPhoto } from "../content/lumora";
import { btn } from "../components/ui";
import { sectionLink } from "../lib/router";
import { Proof } from "./Proof";
import { Projects } from "./Projects";
import { NextHackathon } from "./NextHackathon";
import { Faq } from "./Faq";
import { SitePage } from "./SitePage";
import { HeroPhotos } from "./HeroPhotos";
import { Fade, Rise, Section, SectionHead, isExternal, onAnchor, spotMove, wrap } from "./parts";
import { Stable } from "../i18n/Stable";

/* Lumora home, #/. About Lumora as an organisation, built from the same pieces as the Connect landing:
   hero, real numbers and partners, about, how a round works, winning projects, the next round and
   past rounds, Lumora Connect, FAQ, contacts. Each part links to its own page (src/landing/pages.tsx),
   which reuses the sections below. Facts come from src/content/lumora.ts. */
export function Home({ to }: { to?: string }) {
  return (
    <SitePage to={to}>
      <HomeHero />
      <Proof />
      <About more />
      <Format more />
      <Projects />
      <NextHackathon />
      <ConnectBand />
      <LumoraFaq />
      <Contact more />
    </SitePage>
  );
}

/* Same layout as the Connect hero: kicker, headline, text and two doors, a photo where the deck is. */
function HomeHero() {
  useLang();
  const join = sectionLink("hackathons", "hackathons");
  return (
    <section id="top" className="pt-24 md:pt-32">
      <div className={`${wrap} grid items-center gap-12 md:grid-cols-[1.1fr_0.9fr] md:gap-10`}>
        <div>
          <p className="text-[15px] font-medium text-sky"><Stable k="home.hero.kicker" /></p>
          <h1 className="mt-4 select-none text-balance text-[clamp(34px,4.6vw,60px)] font-semibold leading-[1.05] tracking-[-0.035em]"><Stable k="home.hero.title" /></h1>
          <p className="mt-5 max-w-[68ch] text-[18px] font-medium leading-relaxed text-ink/85 md:text-[20px]"><Stable k="home.hero.steps" /></p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href={join} className="inline-flex min-h-14 items-center justify-center rounded-lg bg-go px-8 text-[17px] font-semibold text-white transition-colors hover:bg-go-deep">
              <Stable k="home.hero.register" />
            </a>
            <a href="#/connect" className="inline-flex min-h-14 items-center justify-center rounded-lg border border-line px-8 text-[17px] font-semibold transition-colors hover:border-sky hover:bg-tint">
              <Stable k="home.hero.connect" />
            </a>
          </div>
        </div>

        <HeroPhotos />
      </div>
    </section>
  );
}

function HeroPhoto({ name }: { name: string }) {
  return (
    <img
      src={photo(name, 800)}
      alt={lumora.photos[name]}
      width={800}
      height={1000}
      decoding="async"
      className="aspect-[4/3] w-full rounded-xl border border-line bg-cloud object-cover md:aspect-[4/5]"
    />
  );
}

/** top of the About, Hackathons and Contacts pages: the hero's type and grid, with a photo */
export function PageHero({ kicker, title, text, photoName, aside }: { kicker: string; title: ReactNode; text: ReactNode; photoName: string; aside?: ReactNode }) {
  useLang();
  return (
    <section id="top" className="pt-24 md:pt-32">
      <div className={`${wrap} grid items-center gap-12 md:grid-cols-[1.35fr_0.65fr] md:gap-10`}>
        <div>
          <p className="text-[15px] font-medium text-sky"><Stable k={kicker} /></p>
          <h1 className="mt-4 select-none text-balance text-[clamp(34px,4.6vw,60px)] font-semibold leading-[1.05] tracking-[-0.035em]">{title}</h1>
          <div className="mt-5 max-w-[68ch] text-[17px] leading-relaxed text-mist md:text-[18px]">{text}</div>
        </div>
        {aside ?? <HeroPhoto name={photoName} />}
      </div>
    </section>
  );
}

/** "Learn more" link in a section head on the home page */
function More({ href }: { href: string }) {
  return (
    <a href={href} className="inline-flex min-h-11 items-center text-[15px] font-semibold text-sky underline-offset-4 hover:underline">
      <Stable k="home.more" />
    </a>
  );
}

const card = "spot rounded-xl border border-line bg-surface p-6 transition-colors hover:border-sky md:p-8";

/** why Lumora, the team in short and the cities. On the About page the team gets its own section, so `team` is off. */
export function About({ more = false, team = true, head = true }: { more?: boolean; team?: boolean; head?: boolean }) {
  useLang();
  return (
    <Section id="about" className="border-t border-line">
      <Fade>
        {head && <SectionHead title={<Stable k="home.about.title" />} lead={<Stable k="home.about.lead" />} aside={more ? <More href="#/about" /> : undefined} />}
        <div className={`grid gap-4 ${team ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
          <div onMouseMove={spotMove} className={card}>
            <h3 className="text-[20px]"><Stable k="home.about.whyTitle" /></h3>
            <p className="mt-4 text-[17px] font-medium leading-snug"><Stable k="home.about.why" /></p>
            <p className="mt-3 text-[15px] leading-relaxed text-mist"><Stable k="home.about.whyMore" /></p>
            {/* facts from src/content/lumora.ts: the first round, the numbers, how cases and juries work */}
            <ul className="mt-5 grid gap-3 border-t border-line pt-5 text-[15px] leading-relaxed">
              {[
                <Stable key="1" k="home.about.fact1" />,
                <Stable key="2" k="home.about.fact2" vars={{ rounds: lumora.numbers.hackathons, regions: lumora.numbers.regions, students: lumora.numbers.students.toLocaleString(locale()) }} />,
                <Stable key="3" k="home.about.fact3" />,
                <Stable key="4" k="home.about.fact4" />,
              ].map((f, n) => (
                <li key={n} className="flex gap-2.5">
                  <Check size={18} aria-hidden className="mt-0.5 shrink-0 text-accent" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {team && (
            <div onMouseMove={spotMove} className={card}>
              <h3 className="text-[20px]"><Stable k="home.about.teamTitle" /></h3>
              <p className="mt-1 text-[15px] text-mist"><Stable k="home.about.teamText" /></p>
              <ul className="mt-5 grid gap-3">
                {lumora.team.map((m) => (
                  <li key={m.name}>
                    <div className="text-[16px] font-semibold">{m.name}</div>
                    <div className="text-[14px] text-mist"><Stable k={`home.about.role.${m.key}`} /></div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div onMouseMove={spotMove} className={card}>
            <h3 className="text-[20px]"><Stable k="home.about.citiesTitle" /></h3>
            {/* every region by name, instead of "14 regions connected" */}
            <ul className="mt-5 flex flex-wrap gap-2">
              {lumora.regions.map((r) => (
                <li key={r} className="rounded-md border border-line px-2.5 py-1 text-[14px]">
                  <Stable k={`home.region.${r}`} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Fade>
    </Section>
  );
}

/** the core team with photos, as on the previous site's About page */
export function Team() {
  useLang();
  return (
    <Section id="team" className="border-t border-line">
      <Fade>
        <SectionHead
          title={
            <>
              <Stable k="home.about.teamTitle" /> <span className="text-sky"><Stable k="home.about.teamText" /></span>
            </>
          }
          lead={<Stable k="home.about.teamLine" />}
        />
        <div className="rounded-xl border border-line p-5 md:p-8">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h3 className="text-[clamp(22px,2.6vw,30px)] tracking-[-0.02em]"><Stable k="home.about.core" /></h3>
            <p className="text-[15px] text-mist"><Stable k="home.about.coreLine" /></p>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {lumora.team.map((m, i) => (
              <Rise key={m.name} i={i} className="min-w-0 rounded-xl border border-line bg-surface p-2 transition-colors hover:border-accent sm:p-3">
                <img
                  src={teamPhoto(m.photo)}
                  alt={m.name}
                  width={400}
                  height={500}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/5] w-full rounded-lg bg-cloud object-cover"
                />
                <div className="px-1 pb-1 pt-3 sm:pt-4">
                  <div className="break-words text-[15px] font-semibold leading-snug tracking-[-0.01em] sm:text-[17px]">{m.name}</div>
                  <div className="mt-0.5 text-[13px] text-sky sm:text-[14px]"><Stable k={`home.about.role.${m.key}`} /></div>
                </div>
              </Rise>
            ))}
          </ul>
        </div>
      </Fade>
    </Section>
  );
}

/** the four stages of a round, what the jury sees, and the share of real cases */
export function Format({ more = false }: { more?: boolean }) {
  useLang();
  return (
    <Section id="format" className="border-t border-line">
      <Fade>
        <SectionHead title={<Stable k="home.format.title" />} lead={<Stable k="home.format.lead" />} aside={more ? <More href="#/hackathons" /> : undefined} />
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {lumora.stages.map((s, i) => (
            <Rise key={s} i={i} className="rounded-xl border border-line bg-surface p-6">
              <div className="flex items-center gap-3">
                <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-sky/40 text-[14px] font-semibold text-sky">
                  {i + 1}
                </span>
                <span className="text-[13px] font-medium text-sky"><Stable k={`home.format.${s}.label`} /></span>
              </div>
              <h3 className="mt-4 text-[18px] tracking-[-0.01em]"><Stable k={`home.format.${s}`} /></h3>
            </Rise>
          ))}
        </ol>

        <div className="mt-4 grid gap-4 md:grid-cols-[1.6fr_1fr]">
          <div className="rounded-xl border border-line p-6 md:p-8">
            <h3 className="text-[19px]"><Stable k="home.format.deliverTitle" /></h3>
            <ul className="mt-5 grid gap-3 sm:grid-cols-3">
              {lumora.deliverables.map((d) => (
                <li key={d} className="flex items-start gap-2.5 text-[16px]">
                  <Check size={18} aria-hidden className="mt-1 shrink-0 text-sky" />
                  <Stable k={`home.format.d.${d}`} />
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col justify-center rounded-xl bg-surface p-6 md:p-8">
            <div className="text-[clamp(34px,4vw,48px)] font-semibold leading-none tracking-[-0.03em] text-accent tabular-nums">{lumora.numbers.realCases}%</div>
            <div className="mt-2 text-[14px] text-mist"><Stable k="home.format.cases" /></div>
            <p className="mt-4 text-[14px] text-mist"><Stable k="home.format.team" /></p>
          </div>
        </div>
      </Fade>
    </Section>
  );
}

export function ConnectBand() {
  useLang();
  return (
    <Section id="connect" className="border-t border-line">
      <div className="grid items-center gap-6 rounded-xl bg-surface p-7 md:grid-cols-[1fr_auto] md:gap-10 md:p-10">
        <div>
          <h2 className="text-[clamp(24px,2.8vw,34px)] tracking-[-0.025em]"><Stable k="home.connect.title" /></h2>
          <p className="mt-3 max-w-[70ch] text-[16px] text-mist"><Stable k="home.connect.text" /></p>
        </div>
        <a href="#/connect" className={btn.secondary}>
          <Stable k="home.connect.cta" />
        </a>
      </div>
    </Section>
  );
}

export function LumoraFaq() {
  return <Faq area="home.faq" keys={["who", "experience", "team", "dates"]} />;
}

/** three routes to Lumora and the official channels. On the Contacts page the hero carries the heading, so `head` is off. */
export function Contact({ more = false, head = true }: { more?: boolean; head?: boolean }) {
  useLang();
  const routes = [
    { key: "students", href: sectionLink("hackathons", "hackathons"), icon: <GraduationCap size={22} aria-hidden /> },
    { key: "companies", href: lumora.links.contact, icon: <Building2 size={22} aria-hidden /> },
    { key: "organizers", href: lumora.links.contact, icon: <LogoTile size={28} /> },
  ];
  const channels: [string, string, ReactNode][] = [
    ["Telegram", lumora.links.telegram, <Send key="t" size={18} aria-hidden />],
    ["Instagram", lumora.links.instagram, <Instagram key="i" size={18} aria-hidden />],
    ["LinkedIn", lumora.links.linkedin, <Linkedin key="l" size={18} aria-hidden />],
  ];
  const ext = (href: string) => (isExternal(href) ? { target: "_blank", rel: "noopener noreferrer" } : {});
  return (
    <Section id="contact" className={head ? "border-t border-line" : ""}>
      <Fade>
        {head && <SectionHead title={<Stable k="home.contact.title" />} lead={<Stable k="home.contact.lead" />} aside={more ? <More href="#/contacts" /> : undefined} />}
        <ul className="grid gap-4 md:grid-cols-3">
          {routes.map((r, i) => (
            <Rise key={r.key} i={i} className="flex flex-col rounded-xl border border-line bg-surface p-6 transition-colors hover:border-sky md:p-8">
              <span className="flex items-center gap-2.5 text-[13px] font-medium text-sky">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-tint text-sky">{r.icon}</span>
                <Stable k={`home.contact.${r.key}`} />
              </span>
              <h3 className="mt-2 text-[20px]"><Stable k={`home.contact.${r.key}.title`} /></h3>
              <div className="mt-auto pt-6">
                <a href={r.href} onClick={(e) => onAnchor(e, r.href)} {...ext(r.href)} className={btn.secondary}>
                  <Stable k={`home.contact.${r.key}.cta`} />
                  {isExternal(r.href) && <ExternalLink size={16} aria-hidden />}
                </a>
              </div>
            </Rise>
          ))}
        </ul>
        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="text-[15px] text-mist">
            <p><Stable k="home.contact.note" /></p>
            <p><Stable k="home.contact.channels" /></p>
          </div>
          <ul className="flex flex-wrap gap-2">
            {channels.map(([label, href, icon]) => (
              <li key={label}>
                <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line px-4 text-[15px] font-medium transition-colors hover:border-sky hover:bg-tint">
                  {icon}
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Fade>
    </Section>
  );
}

/** what to put in the first message, from the previous site's contact page */
export function FirstMessage() {
  useLang();
  return (
    <Section id="first-message" className="border-t border-line">
      <Fade className="grid gap-6 rounded-xl bg-surface p-7 md:grid-cols-[1fr_1fr] md:gap-10 md:p-10">
        <div>
          <h2 className="text-[clamp(24px,2.8vw,34px)] tracking-[-0.025em]"><Stable k="home.contacts.firstTitle" /></h2>
          <p className="mt-3 max-w-[60ch] text-[16px] text-mist"><Stable k="home.contacts.firstText" /></p>
        </div>
        <ol className="grid content-center gap-4">
          {[1, 2, 3].map((n) => (
            <li key={n} className="grid grid-cols-[32px_1fr] items-center gap-4">
              <span aria-hidden className="grid h-8 w-8 place-items-center rounded-full border border-sky/40 text-[14px] font-semibold text-sky">
                {n}
              </span>
              <span className="text-[17px] font-medium"><Stable k={`home.contacts.first${n}`} /></span>
            </li>
          ))}
        </ol>
      </Fade>
    </Section>
  );
}
