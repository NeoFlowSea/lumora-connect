import { useEffect, useState } from "react";
import { Splash } from "./components/Splash";
import { ToastProvider } from "./components/ui";
import { Landing } from "./landing/Landing";
import { AppShell, defaultTab, tabsFor } from "./app/AppShell";
import { Swipe } from "./app/Swipe";
import { OpportunitiesTab } from "./app/OpportunitiesTab";
import { HackathonsTab } from "./app/HackathonsTab";
import { ProfileTab } from "./app/ProfileTab";
import { Dashboard } from "./app/Dashboard";
import { Inbox } from "./app/Inbox";
import { NotificationsPage } from "./app/Notifications";
import { AdminApp } from "./admin/AdminApp";
import { AuthScreen } from "./auth/AuthScreen";
import { useSession } from "./api/hooks";
import { go, useRoute } from "./lib/router";

export default function App() {
  const [intro, setIntro] = useState(true);
  const { path, query } = useRoute();
  const user = useSession();
  const [section, sub, extra] = path;

  // route guards
  useEffect(() => {
    if (section === "app" || section === "admin") {
      if (!user) go(`#/login?next=${encodeURIComponent(window.location.hash)}`);
      else if (section === "app" && user.kind === "admin") go("#/admin");
      else if (section === "admin" && user.kind !== "admin") go(`#/app/${defaultTab(user)}`);
      else if (section === "app" && sub && !tabsFor(user).some((t) => t.key === sub) && !["inbox", "notifications"].includes(sub))
        go(`#/app/${defaultTab(user)}`);
    }
    if ((section === "login" || section === "register") && user) {
      go(query.next && query.next.startsWith("#/") ? query.next : user.kind === "admin" ? "#/admin" : `#/app/${defaultTab(user)}`);
    }
  }, [section, sub, user, query.next]);

  let page;
  if (section === "login" || section === "register") {
    page = <AuthScreen mode={section} initialType={query.type === "company" ? "company" : query.type === "talent" ? "talent" : undefined} />;
  } else if (section === "admin" && user?.kind === "admin") {
    page = <AdminApp path={path.slice(1)} />;
  } else if (section === "app" && user && user.kind !== "admin") {
    const tab = sub ?? defaultTab(user);
    page = (
      <AppShell tab={tab}>
        <div key={tab}>
          {tab === "swipe" && <Swipe />}
          {tab === "opportunities" && <OpportunitiesTab />}
          {tab === "dashboard" && <Dashboard />}
          {tab === "hackathons" && <HackathonsTab focusId={extra} />}
          {tab === "profile" && <ProfileTab />}
          {tab === "inbox" && <Inbox matchId={extra} />}
          {tab === "notifications" && <NotificationsPage />}
        </div>
      </AppShell>
    );
  } else if (section === "app" || section === "admin") {
    page = <div className="min-h-[100svh] bg-paper" />; // guard is redirecting
  } else {
    page = <Landing />;
  }

  return (
    <ToastProvider>
      {page}
      {intro && <Splash onDone={() => setIntro(false)} />}
    </ToastProvider>
  );
}
