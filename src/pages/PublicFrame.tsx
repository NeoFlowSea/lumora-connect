import { useEffect, type ReactNode } from "react";
import { useSession } from "../api/hooks";
import { AppShell } from "../app/AppShell";
import { Nav } from "../landing/Nav";
import { Footer } from "../landing/Footer";
import { SiteTabs } from "../landing/SiteTabs";
import { go } from "../lib/router";
import { currentUser } from "../api";
import { defaultTab } from "../app/AppShell";

/* Pages that anyone can open (jobs, company pages, legal, 404).
   Signed-in talent and companies see them inside the app shell; everyone else gets the site header and footer. */
export function PublicFrame({ children, tab = "opportunities", bare = false }: { children: ReactNode; tab?: string; bare?: boolean }) {
  const user = useSession();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);
  if (user && user.kind !== "admin" && !bare) return <AppShell tab={tab}>{children}</AppShell>;
  return (
    <div className="flex min-h-[100svh] flex-col bg-paper pb-16 md:pb-0">
      <Nav onOpenApp={openApp} />
      <main className="flex-1 pt-18">{children}</main>
      <Footer />
      <SiteTabs />
    </div>
  );
}

export function openApp(target?: string) {
  const u = currentUser();
  if (u) go(u.kind === "admin" ? "#/admin" : (target ?? `#/app/${defaultTab(u)}`));
  else go(`#/login${target ? `?next=${encodeURIComponent(target)}` : ""}`);
}
