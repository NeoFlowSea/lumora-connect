import { AdminShell, type AdminSection } from "./AdminShell";
import { Overview } from "./Overview";
import { Verification } from "./Verification";
import { Companies } from "./Companies";
import { Users } from "./Users";
import { Opportunities } from "./Opportunities";
import { Audit } from "./Audit";
import { EventsList } from "./events/EventsList";
import { EventEditor } from "./events/EventEditor";
import { EventTeams } from "./events/EventTeams";
import { useLang } from "../i18n";

/* Admin area for #/admin/<section>. path is the hash path after "admin". */
export function AdminApp({ path }: { path: string[] }) {
  useLang(); // every admin screen below re-renders when the language changes
  const [first, second, third] = path;
  const known: AdminSection[] = ["overview", "verification", "companies", "users", "events", "opportunities", "audit"];
  const section: AdminSection = known.includes(first as AdminSection) ? (first as AdminSection) : "overview";

  let page;
  switch (section) {
    case "verification":
      page = <Verification />;
      break;
    case "companies":
      page = <Companies />;
      break;
    case "users":
      page = <Users />;
      break;
    case "opportunities":
      page = <Opportunities />;
      break;
    case "audit":
      page = <Audit />;
      break;
    case "events":
      if (!second) page = <EventsList />;
      else if (second === "new") page = <EventEditor />;
      else if (third === "teams") page = <EventTeams id={second} />;
      else page = <EventEditor id={second} />;
      break;
    default:
      page = <Overview />;
  }

  return (
    <AdminShell section={section}>
      <div key={path.join("/")}>{page}</div>
    </AdminShell>
  );
}
