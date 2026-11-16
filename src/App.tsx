import { useState } from "react";
import { Splash } from "./components/Splash";
import { ToastProvider } from "./components/ui";
import { RolePicker } from "./components/RolePicker";
import { Landing } from "./landing/Landing";
import { AppShell } from "./app/AppShell";
import { Swipe } from "./app/Swipe";
import { OpportunitiesTab } from "./app/OpportunitiesTab";
import { HackathonsTab } from "./app/HackathonsTab";
import { ProfileTab } from "./app/ProfileTab";
import { useRoute, go } from "./lib/router";
import { useStore } from "./lib/store";

export default function App() {
  const [intro, setIntro] = useState(true);
  const route = useRoute();
  const { role } = useStore();

  return (
    <ToastProvider>
      {route.page === "landing" ? (
        <Landing />
      ) : role ? (
        <AppShell tab={route.tab}>
          {/* tabs switch instantly; the intro plays only on a page load */}
          <div key={route.tab}>
            {route.tab === "swipe" && <Swipe />}
            {route.tab === "opportunities" && <OpportunitiesTab />}
            {route.tab === "hackathons" && <HackathonsTab />}
            {route.tab === "profile" && <ProfileTab />}
          </div>
        </AppShell>
      ) : (
        <>
          <Landing />
          <RolePicker open onClose={() => go("#/")} />
        </>
      )}
      {intro && <Splash onDone={() => setIntro(false)} />}
    </ToastProvider>
  );
}
