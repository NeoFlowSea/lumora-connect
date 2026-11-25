import { currentUser } from "../../api";
import { go } from "../../lib/router";
import { openApp } from "../../pages/PublicFrame";
import { AFTER_ONBOARDING } from "../../onboarding/Onboarding";
import { NEXT_ROUND } from "./content";

/* "Register your team": the next round's page in the app, where a team is added.
   Visitors without an account go to sign-up first and come back to the round afterwards. */
export function registerTeam() {
  const target = `#/app/hackathons/${NEXT_ROUND.id}`;
  if (currentUser()) openApp(target);
  else {
    try {
      sessionStorage.setItem(AFTER_ONBOARDING, target);
    } catch {
      /* ignore: onboarding then opens the app's default tab */
    }
    go(`#/register?type=talent&next=${encodeURIComponent(target)}`);
  }
}
