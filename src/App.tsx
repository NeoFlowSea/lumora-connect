import { lazy, Suspense, useEffect, useState } from "react";
import { Splash } from "./components/Splash";
import { ToastProvider } from "./components/ui";
import { Loading } from "./components/form";
import { Landing } from "./landing/Landing";
import { AppShell, defaultTab, tabsFor } from "./app/AppShell";
import { Swipe } from "./app/Swipe";
import { HackathonsTab } from "./app/HackathonsTab";
import { ProfileTab } from "./app/ProfileTab";
import { Dashboard } from "./app/Dashboard";
import { Inbox } from "./app/Inbox";
import { NotificationsPage } from "./app/Notifications";
import { JobsBrowser } from "./app/JobsBrowser";
import { JobPage } from "./app/JobPage";
import { CompanyPage } from "./app/CompanyPage";
import { TalentPage } from "./app/TalentPage";
import { AuthScreen } from "./auth/AuthScreen";
import { ConfirmScreen, ForgotScreen, ResetScreen } from "./auth/Recover";
import { Onboarding } from "./onboarding/Onboarding";
import { PublicFrame } from "./pages/PublicFrame";
import { NotFound } from "./pages/NotFound";
import { Legal } from "./pages/Legal";
import { useSession } from "./api/hooks";
import { go, useRoute } from "./lib/router";

// admin is a separate chunk: visitors never download it
const AdminApp = lazy(() => import("./admin/AdminApp").then((m) => ({ default: m.AdminApp })));

/* Routes
   #/                      landing
   #/jobs, #/jobs/:id      opportunities, public
   #/company/:id           company page, public
   #/privacy, #/terms      legal pages
   #/login, #/register, #/forgot, #/reset?token=, #/confirm?token=
   #/onboarding            first steps after sign-up
   #/app/<tab>/...         talent and company app (signed in)
   #/app/talent/:id        talent page (signed in)
   #/admin/...             admin (admins only)
   anything else           404 */

const APP_EXTRA = ["inbox", "notifications", "talent", "jobs", "company"];

function introWanted() {
  if (window.location.hash.startsWith("#/")) return false; // deep links skip the intro
  try {
    if (sessionStorage.getItem("lumora-intro")) return false;
    sessionStorage.setItem("lumora-intro", "1");
  } catch {
    /* ignore */
  }
  return true;
}

export default function App() {
  const [intro, setIntro] = useState(introWanted);
  const { path, query } = useRoute();
  const user = useSession();
  const [section, sub, extra] = path;

  // route guards
  useEffect(() => {
    if (section === "app" || section === "admin" || section === "onboarding") {
      if (!user) go(`#/login?next=${encodeURIComponent(window.location.hash)}`);
      else if ((section === "app" || section === "onboarding") && user.kind === "admin") go("#/admin");
      else if (section === "admin" && user.kind !== "admin") go(`#/app/${defaultTab(user)}`);
      else if (section === "app" && user.kind !== "admin" && !user.onboarded) go("#/onboarding");
      else if (section === "app" && sub && !tabsFor(user).some((t) => t.key === sub) && !APP_EXTRA.includes(sub)) go(`#/app/${defaultTab(user)}`);
      // the app's jobs and company pages are the public ones, shown inside the shell
      else if (section === "app" && sub === "jobs") go(extra ? `#/jobs/${extra}` : "#/jobs");
      else if (section === "app" && sub === "company" && extra) go(`#/company/${extra}`);
    }
    if ((section === "login" || section === "register") && user) {
      const next = query.next && query.next.startsWith("#/") ? query.next : null;
      if (user.kind === "admin") go(next ?? "#/admin");
      else if (!user.onboarded) go("#/onboarding");
      else go(next ?? `#/app/${defaultTab(user)}`);
    }
  }, [section, sub, extra, user, query.next]);

  let page;
  if (!section) {
    page = <Landing />;
  } else if (section === "login" || section === "register") {
    page = <AuthScreen mode={section} initialType={query.type === "company" ? "company" : query.type === "talent" ? "talent" : undefined} />;
  } else if (section === "forgot") {
    page = <ForgotScreen />;
  } else if (section === "reset") {
    page = <ResetScreen token={query.token ?? ""} />;
  } else if (section === "confirm") {
    page = <ConfirmScreen token={query.token ?? ""} />;
  } else if (section === "onboarding" && user && user.kind !== "admin") {
    page = <Onboarding />;
  } else if (section === "jobs") {
    page = <PublicFrame>{sub ? <JobPage key={sub} id={sub} /> : <JobsBrowser />}</PublicFrame>;
  } else if (section === "company" && sub) {
    page = (
      <PublicFrame>
        <CompanyPage key={sub} id={sub} />
      </PublicFrame>
    );
  } else if (section === "privacy" || section === "terms") {
    page = (
      <PublicFrame bare>
        <Legal kind={section} />
      </PublicFrame>
    );
  } else if (section === "admin" && user?.kind === "admin") {
    page = (
      <Suspense fallback={<div className="grid min-h-[100svh] place-items-center bg-paper"><Loading /></div>}>
        <AdminApp path={path.slice(1)} />
      </Suspense>
    );
  } else if (section === "app" && user && user.kind !== "admin" && user.onboarded) {
    const tab = sub ?? defaultTab(user);
    page = (
      <AppShell tab={tab === "talent" ? (user.kind === "company" ? "swipe" : "profile") : tab}>
        <div key={`${tab}/${extra ?? ""}`}>
          {tab === "swipe" && <Swipe />}
          {tab === "opportunities" && <JobsBrowser />}
          {tab === "dashboard" && <Dashboard />}
          {tab === "hackathons" && <HackathonsTab focusId={extra} />}
          {tab === "profile" && <ProfileTab />}
          {tab === "inbox" && <Inbox matchId={extra} />}
          {tab === "notifications" && <NotificationsPage />}
          {tab === "talent" && extra && <TalentPage id={extra} />}
        </div>
      </AppShell>
    );
  } else if (section === "app" || section === "admin" || section === "onboarding") {
    page = <div className="min-h-[100svh] bg-paper" />; // guard is redirecting
  } else {
    page = (
      <PublicFrame bare>
        <NotFound />
      </PublicFrame>
    );
  }

  return (
    <ToastProvider>
      {page}
      {intro && <Splash onDone={() => setIntro(false)} />}
    </ToastProvider>
  );
}
