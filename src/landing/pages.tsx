import { lumora } from "../content/lumora";
import { Proof } from "./Proof";
import { Projects } from "./Projects";
import { NextHackathon } from "./NextHackathon";
import { Quotes } from "./Quotes";
import { SitePage } from "./SitePage";
import { About, ConnectBand, Contact, FirstMessage, Format, LumoraFaq, PageHero, Team } from "./Home";
import { Stable } from "../i18n/Stable";
import { LogoTile } from "../components/Logo";

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
          </>
        }
        photoName="school21-hallway"
        aside={
          // the Lumora mark instead of a photo
          <div className="grid aspect-[4/3] w-full place-items-center rounded-xl border border-line bg-surface md:aspect-[4/5]">
            <LogoTile size={180} />
          </div>
        }
      />
      <Contact head={false} />
      <FirstMessage />
    </SitePage>
  );
}
