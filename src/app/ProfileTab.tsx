import { useSession } from "../api/hooks";
import { useLang } from "../i18n";
import { TalentProfilePage } from "./profile/TalentProfilePage";
import { CompanyProfilePage } from "./profile/CompanyProfilePage";

/* #/app/profile: the signed-in talent's or company's own profile.
   Sections on the left, a sticky summary with completeness and verification on the right. */

export function ProfileTab() {
  useLang();
  const user = useSession();
  if (!user || user.kind === "admin") return null;
  return user.kind === "talent" ? <TalentProfilePage key={user.id} u={user} /> : <CompanyProfilePage key={user.id} c={user} />;
}
