import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
          <AnimatePresence mode="wait">
            <motion.div
              key={route.tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {route.tab === "swipe" && <Swipe />}
              {route.tab === "opportunities" && <OpportunitiesTab />}
              {route.tab === "hackathons" && <HackathonsTab />}
              {route.tab === "profile" && <ProfileTab />}
            </motion.div>
          </AnimatePresence>
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
