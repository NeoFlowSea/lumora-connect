import { lazy, Suspense, useEffect, useState } from "react";
import { Splash } from "./components/Splash";
import { ToastProvider } from "./components/ui";
import { Loading } from "./components/form";
import { Landing } from "./landing/Landing";
import { Home } from "./landing/Home";
import { AboutPage, ContactsPage, HackathonsPage } from "./landing/pages";
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
import { useReady, useSession } from "./api/hooks";
import { go, legacyAnchor, useRoute } from "./lib/router";

// admin is a separate chunk: visitors never download it
const AdminApp = lazy(() => import("./admin/AdminApp").then((m) => ({ default: m.AdminApp })));

/* Routes
   #/                      Lumora home (about Lumora, rounds, contacts)
   #/about, #/hackathons, #/contacts   Lumora pages
   #/connect               Lumora Connect landing
   ?to=<id> on either      open at that section; old anchors like "#talent" go to the Connect page
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

export default function App() {
  const [intro, setIntro] = useState(true); // the launch intro plays on every visit
  const { path, query } = useRoute();
  const user = useSession();
  const ready = useReady();
  const [section, sub, extra] = path;

  // anchors from the old single landing now live on the Connect page
  useEffect(() => {
    if (section) return;
    const moved = legacyAnchor(window.location.hash);
    if (moved) window.location.replace(moved);
  }, [section]);

  // route guards: wait for the first load from the database, so a signed-in visitor is not sent to the sign-in page
  useEffect(() => {
    if (!ready) return;
    if (section === "app" || section === "admin" || section === "onboarding") {
      if (!user) go(`#/login?next=${encodeURIComponent(window.location.hash)}`);
      else if ((section === "app" || section === "onboarding") && user.kind === "admin" && !(sub === "talent" && extra)) go("#/admin");
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
  }, [ready, section, sub, extra, user, query.next]);

  let page;
  if (!section) {
    page = <Home to={query.to} />;
  } else if (section === "connect" && !sub) {
    page = <Landing to={query.to} />;
  } else if (section === "about" && !sub) {
    page = <AboutPage to={query.to} />;
  } else if (section === "hackathons" && !sub) {
    page = <HackathonsPage to={query.to} />;
  } else if (section === "contacts" && !sub) {
    page = <ContactsPage to={query.to} />;
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
  } else if (section === "app" && sub === "talent" && extra && user?.kind === "admin") {
    page = (
      <PublicFrame bare>
        <div className="mx-auto max-w-[1240px] px-5 pb-16 pt-6 md:px-8">
          <TalentPage key={extra} id={extra} />
        </div>
      </PublicFrame>
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
