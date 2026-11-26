import { lumora } from "../content/lumora";
import { Proof } from "./Proof";
import { Projects } from "./Projects";
import { NextHackathon } from "./NextHackathon";
import { Quotes } from "./Quotes";
import { SitePage } from "./SitePage";
import { About, ConnectBand, Contact, FirstMessage, Format, LumoraFaq, PageHero, Team } from "./Home";
import { Stable } from "../i18n/Stable";
import { LogoTile } from "../components/Logo";
import { btn } from "../components/ui";
import { Instagram, Linkedin, Send, type LucideIcon } from "lucide-react";

/** official Lumora channels for the Contacts hero card: label, handle, link, icon */
const CHANNELS: [string, string, string, LucideIcon][] = [
  ["Telegram", "@thelumoraa", lumora.links.telegram, Send],
  ["Instagram", "@lumora2025_", lumora.links.instagram, Instagram],
  ["LinkedIn", "lumora-uz", lumora.links.linkedin, Linkedin],
];

/* The Lumora pages behind the header links: #/about, #/hackathons, #/contacts.
   Each one is the matching home section in full, plus what only fits on its own page. */

export function AboutPage({ to }: { to?: string }) {
  return (
    <SitePage to={to}>
      <PageHero
        kicker="home.about.kicker"
        title={<Stable k="home.about.title" />}
        text={
          <>
            <p><Stable k="home.about.lead" /></p>
            <p className="mt-3"><Stable k="home.about.whyMore" /></p>
          </>
        }
        photoName="tashkent-stage"
      />
      <Proof />
      <About team={false} head={false} />
      <Team />
      <Quotes />
      <ConnectBand />
    </SitePage>
  );
}

export function HackathonsPage({ to }: { to?: string }) {
  return (
    <SitePage to={to}>
      <PageHero
        kicker="home.hackathons.kicker"
        title={<Stable k="home.hackathons.title" />}
        text={
          <>
            <p><Stable k="home.hero.text" /></p>
            <p className="mt-3"><Stable k="home.about.regions" vars={{ n: lumora.numbers.regions }} /></p>
          </>
        }
        photoName="school21-pitch"
      />
      <Format />
      <NextHackathon allRounds />
      <Projects />
      <LumoraFaq />
    </SitePage>
  );
}

export function ContactsPage({ to }: { to?: string }) {
  return (
    <SitePage to={to}>
      <PageHero
        kicker="home.contacts.kicker"
        title={<Stable k="home.contact.title" />}
        text={
          <>
            <p><Stable k="home.contact.lead" /></p>
            <p className="mt-3"><Stable k="home.contact.note" /></p>
            {/* the quickest way to reach a person: the one main action on this screen */}
            <a href={lumora.links.contact} target="_blank" rel="noopener noreferrer" className={`${btn.primary} mt-8 !min-h-14 !px-7 !text-[17px]`}>
              <Send size={18} aria-hidden /> <Stable k="home.contacts.write" />
            </a>
            <p className="mt-3 text-[14px] text-mist">@{lumora.links.contact.split("/").pop()}</p>
          </>
        }
        photoName="school21-hallway"
        aside={
          // the Lumora mark with the official channels under it
          <div className="flex w-full flex-col items-center justify-center gap-8 rounded-xl border border-line bg-surface p-8 md:aspect-[4/5]">
            <LogoTile size={150} />
            <div className="w-full max-w-[300px]">
              <p className="text-center text-[14px] font-medium text-sky"><Stable k="home.contacts.channelsTitle" /></p>
              <ul className="mt-3 grid gap-2">
                {CHANNELS.map(([label, handle, href, Icon]) => (
                  <li key={label}>
                    <a href={href} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center gap-3 rounded-lg border border-line px-4 transition-colors hover:border-sky hover:bg-tint">
                      <Icon size={18} aria-hidden className="shrink-0 text-sky" />
                      <span className="text-[15px] font-semibold">{label}</span>
                      <span className="ml-auto truncate text-[14px] text-mist">{handle}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        }
      />
      <Contact head={false} />
      <FirstMessage />
    </SitePage>
  );
}
