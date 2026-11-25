import { useEffect } from "react";
import { useLang } from "../../i18n";
import { SitePage } from "../SitePage";
import { Faq } from "../Faq";
import { IntroHero } from "./IntroHero";
import { ConnectSoon, Cases, ForCompanies, HowItWorks, NextRound, Numbers, Partners, Regions } from "./sections";
import { registerTeam } from "./register";
import "./intro.css";

/* Lumora home, #/ (design/landing): the logo intro, then the sections of the team's brief.
   The previous home is still in src/landing/Home.tsx; its sections are used by the About,
   Hackathons and Contacts pages. */
export function IntroHome({ to }: { to?: string }) {
  const { t } = useLang();

  // the page background behind overscroll and the phone tab bar
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = "#071a3f";
    return () => {
      document.body.style.background = prev;
    };
  }, []);

  return (
    <div className="intro-theme">
      <SitePage to={to} cta={{ label: t("intro.nav.register"), short: t("intro.nav.registerShort"), act: registerTeam }}>
        <IntroHero />
        <Numbers />
        <HowItWorks />
        <Regions />
        <Cases />
        <Partners />
        <ConnectSoon />
        <ForCompanies />
        <NextRound />
        <Faq area="intro.faq" keys={["who", "team", "experience", "build", "where", "partner"]} />
      </SitePage>
    </div>
  );
}
