import { Hero } from "./Hero";
import { Proof } from "./Proof";
import { Featured } from "./Featured";
import { HowItWorks } from "./HowItWorks";
import { Projects } from "./Projects";
import { NextHackathon } from "./NextHackathon";
import { Quotes } from "./Quotes";
import { Faq } from "./Faq";
import { FinalCta } from "./FinalCta";
import { SitePage } from "./SitePage";

/* Lumora Connect landing, #/connect. Order: hero with two doors and job search, real numbers and partners,
   open postings, how it works, winning projects, the next round, Lumora's own lines, FAQ, the doors again. */
export function Landing({ to }: { to?: string }) {
  return (
    <SitePage to={to}>
      <Hero />
      <Proof />
      <Featured />
      <HowItWorks />
      <Projects />
      <NextHackathon />
      <Quotes />
      <Faq />
      <FinalCta />
    </SitePage>
  );
}
