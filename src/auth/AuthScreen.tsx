import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Building2, Eye, EyeOff, KeyRound, RotateCcw, Sparkles } from "lucide-react";
import { api } from "../api";
import { useAction } from "../api/hooks";
import { DEMO_ACCOUNTS } from "../api/seed";
import type { OrgKind } from "../api/types";
import { categories } from "../data";
import { Wordmark } from "../components/Logo";
import { ErrorNote, Field, Input, Select, Spinner, Textarea } from "../components/form";
import { btn, ease, Modal } from "../components/ui";
import { go } from "../lib/router";

type Mode = "login" | "register";
type AccountType = "talent" | "company";

export function AuthScreen({ mode, initialType }: { mode: Mode; initialType?: AccountType }) {
  return (
    <div className="min-h-[100svh] bg-paper">
      <header className="mx-auto flex h-18 max-w-[1240px] items-center justify-between px-5 md:px-8">
        <a href="#/" aria-label="Lumora Connect home">
          <Wordmark />
        </a>
        <a href="#/" className="text-[13px] font-semibold text-mist hover:text-ink">
          Back to site
        </a>
      </header>
      <main className="mx-auto grid max-w-[1240px] gap-8 px-5 pb-20 pt-4 md:grid-cols-[1fr_420px] md:gap-12 md:px-8 md:pt-10">
        <div className="order-1">{mode === "login" ? <LoginForm /> : <RegisterFlow initialType={initialType} />}</div>
        <aside className="order-2">
          <DemoPanel />
        </aside>
      </main>
    </div>
  );
}

/* ---------- login ---------- */

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const login = useAction(api.auth.login);

  function submit(e: FormEvent) {
    e.preventDefault();
    login.run(email, password);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} className="max-w-[520px]">
      <h1 className="text-[clamp(28px,4vw,40px)]">Sign in</h1>
      <p className="mt-2 text-[14px] text-mist">Talent, companies and Lumora admins all sign in here.</p>
      <form onSubmit={submit} className="mt-8 grid gap-4 rounded-3xl border border-line bg-surface p-6 md:p-8">
        <Field label="Email">
          <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.uz" />
        </Field>
        <Field label="Password">
          <div className="relative">
            <Input
              type={show ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-mist hover:text-ink"
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>
        <ErrorNote>{login.error}</ErrorNote>
        <button type="submit" disabled={login.pending} className={`${btn.primary} mt-2 w-full disabled:opacity-70`}>
          {login.pending && <Spinner />} Sign in
        </button>
        <p className="text-center text-[13px] text-mist">
          New here?{" "}
          <a href="#/register" className="font-semibold text-sky underline-offset-4 hover:underline">
            Create an account
          </a>
        </p>
      </form>
    </motion.div>
  );
}

/* ---------- register ---------- */

function RegisterFlow({ initialType }: { initialType?: AccountType }) {
  const [type, setType] = useState<AccountType | null>(initialType ?? null);
  return (
    <div className="max-w-[620px]">
      <AnimatePresence mode="wait" initial={false}>
        {!type ? (
          <motion.div key="pick" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease }}>
            <h1 className="text-[clamp(28px,4vw,40px)]">Create an account</h1>
            <p className="mt-2 text-[14px] text-mist">First, what kind of account is this? You cannot change it later.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <TypeCard
                icon={<Sparkles size={20} />}
                title="Talent"
                text="Students and young developers. Swipe companies, apply to internships, join hackathons."
                onClick={() => setType("talent")}
              />
              <TypeCard
                icon={<Building2 size={20} />}
                title="Company or organization"
                text="Hire interns and juniors, swipe verified talent, run or sponsor events. Reviewed by Lumora first."
                onClick={() => setType("company")}
                accent
              />
            </div>
            <p className="mt-6 text-[13px] text-mist">
              Already have an account?{" "}
              <a href="#/login" className="font-semibold text-sky underline-offset-4 hover:underline">
                Sign in
              </a>
            </p>
          </motion.div>
        ) : (
          <motion.div key={type} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease }}>
            <button onClick={() => setType(null)} className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-mist hover:text-ink">
              <ArrowLeft size={15} /> Change account type
            </button>
            <h1 className="text-[clamp(26px,3.6vw,36px)]">{type === "talent" ? "Create a talent account" : "Register a company or organization"}</h1>
            <p className="mt-2 text-[14px] text-mist">
              {type === "talent"
                ? "Admins verify talent after a first Lumora event. Your hackathon badges appear on your profile automatically."
                : "New companies start as pending. A Lumora admin reviews you, usually within a day, then swiping and posting unlock."}
            </p>
            {type === "talent" ? <TalentForm /> : <CompanyForm />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TypeCard({ icon, title, text, onClick, accent }: { icon: React.ReactNode; title: string; text: string; onClick: () => void; accent?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="group rounded-3xl border border-line bg-surface p-6 text-left transition-[border-color,transform,background-color] hover:-translate-y-0.5 hover:border-accent"
    >
      <span className={`grid h-11 w-11 place-items-center rounded-xl ${accent ? "bg-accent text-paper" : "bg-blue text-white"}`}>{icon}</span>
      <span className="mt-5 block font-display text-[18px] font-semibold">{title}</span>
      <span className="mt-1.5 block text-[13px] leading-relaxed text-mist">{text}</span>
    </button>
  );
}

function Credentials({ email, setEmail, password, setPassword }: { email: string; setEmail: (v: string) => void; password: string; setPassword: (v: string) => void }) {
  return (
    <>
      <Field label="Email">
        <Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Password" hint="At least 8 characters.">
        <Input type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
    </>
  );
}

function TalentForm() {
  const [f, setF] = useState({ email: "", password: "", name: "", cat: categories[0].name, city: "", age: "", skills: "", contact: "" });
  const reg = useAction(api.auth.register);
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  function submit(e: FormEvent) {
    e.preventDefault();
    reg.run({
      type: "talent",
      email: f.email,
      password: f.password,
      name: f.name,
      cat: f.cat,
      city: f.city,
      age: f.age ? Number(f.age) : null,
      skills: f.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      contact: f.contact,
    });
  }

  return (
    <form onSubmit={submit} className="mt-8 grid gap-4 rounded-3xl border border-line bg-surface p-6 sm:grid-cols-2 md:p-8">
      <Field label="Full name" className="sm:col-span-2">
        <Input required value={f.name} onChange={(e) => set("name")(e.target.value)} placeholder="Dilnoza Karimova" />
      </Field>
      <Credentials email={f.email} setEmail={set("email")} password={f.password} setPassword={set("password")} />
      <Field label="Main track">
        <Select value={f.cat} onChange={(e) => set("cat")(e.target.value)} options={categories.map((c) => c.name)} />
      </Field>
      <Field label="City">
        <Input value={f.city} onChange={(e) => set("city")(e.target.value)} placeholder="Tashkent" />
      </Field>
      <Field label="Age">
        <Input type="number" min={12} max={40} value={f.age} onChange={(e) => set("age")(e.target.value)} />
      </Field>
      <Field label="Telegram">
        <Input value={f.contact} onChange={(e) => set("contact")(e.target.value)} placeholder="@username" />
      </Field>
      <Field label="Skills" hint="Comma separated, for example React, Figma, Python." className="sm:col-span-2">
        <Input value={f.skills} onChange={(e) => set("skills")(e.target.value)} />
      </Field>
      <div className="grid gap-3 sm:col-span-2">
        <ErrorNote>{reg.error}</ErrorNote>
        <button type="submit" disabled={reg.pending} className={`${btn.primary} w-full disabled:opacity-70`}>
          {reg.pending && <Spinner />} Create talent account
        </button>
      </div>
    </form>
  );
}

function CompanyForm() {
  const [f, setF] = useState({ email: "", password: "", name: "", orgKind: "company" as OrgKind, industry: "", city: "", size: "11-50 people", website: "", contact: "", about: "" });
  const reg = useAction(api.auth.register);
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));

  function submit(e: FormEvent) {
    e.preventDefault();
    reg.run({ type: "company", ...f });
  }

  return (
    <form onSubmit={submit} className="mt-8 grid gap-4 rounded-3xl border border-line bg-surface p-6 sm:grid-cols-2 md:p-8">
      <div className="sm:col-span-2">
        <span className="text-[12px] font-semibold text-mist">This is a</span>
        <div className="mt-1.5 inline-flex rounded-full border border-line p-1">
          {(["company", "organization"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setF((s) => ({ ...s, orgKind: k }))}
              className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors ${f.orgKind === k ? "bg-accent text-paper" : "text-mist hover:text-ink"}`}
            >
              {k === "company" ? "Company" : "Organization or community"}
            </button>
          ))}
        </div>
      </div>
      <Field label={f.orgKind === "company" ? "Company name" : "Organization name"} className="sm:col-span-2">
        <Input required value={f.name} onChange={(e) => set("name")(e.target.value)} placeholder={f.orgKind === "company" ? "NovaSoft" : "AI Alliance"} />
      </Field>
      <Credentials email={f.email} setEmail={set("email")} password={f.password} setPassword={set("password")} />
      <Field label="Industry">
        <Input value={f.industry} onChange={(e) => set("industry")(e.target.value)} placeholder="EdTech" />
      </Field>
      <Field label="City">
        <Input value={f.city} onChange={(e) => set("city")(e.target.value)} placeholder="Tashkent" />
      </Field>
      <Field label="Size">
        <Select value={f.size} onChange={(e) => set("size")(e.target.value)} options={["1-10 people", "11-50 people", "51-200 people", "200+ people"]} />
      </Field>
      <Field label="Website">
        <Input value={f.website} onChange={(e) => set("website")(e.target.value)} placeholder="novasoft.uz" />
      </Field>
      <Field label="Contact for candidates" className="sm:col-span-2">
        <Input value={f.contact} onChange={(e) => set("contact")(e.target.value)} placeholder="hr@novasoft.uz or @novasoft_hr" />
      </Field>
      <Field label="About" hint="What you build and who you want to hire. Admins read this when reviewing you." className="sm:col-span-2">
        <Textarea value={f.about} onChange={(e) => set("about")(e.target.value)} />
      </Field>
      <div className="grid gap-3 sm:col-span-2">
        <ErrorNote>{reg.error}</ErrorNote>
        <button type="submit" disabled={reg.pending} className={`${btn.primary} w-full disabled:opacity-70`}>
          {reg.pending && <Spinner />} Send for review
        </button>
      </div>
    </form>
  );
}

/* ---------- demo accounts ---------- */

function DemoPanel() {
  const login = useAction(api.auth.login);
  const reset = useAction(api.auth.resetDemo);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  async function signIn(email: string, password: string) {
    setBusy(email);
    await login.run(email, password);
    setBusy(null);
  }

  return (
    <div className="rounded-3xl border border-line bg-surface p-5 md:sticky md:top-8 md:p-6">
      <div className="flex items-center gap-2">
        <KeyRound size={17} className="text-accent" />
        <h2 className="text-[17px]">Demo accounts</h2>
      </div>
      <p className="mt-1.5 text-[12px] leading-relaxed text-mist">
        One click signs you in. This preview keeps data in your own browser only, so anything you change here is not seen by other people.
      </p>
      <ul className="mt-4 grid gap-2">
        {DEMO_ACCOUNTS.map((d) => (
          <li key={d.email}>
            <button
              onClick={() => signIn(d.email, d.password)}
              disabled={!!busy}
              className="group w-full rounded-2xl border border-line bg-paper/40 p-3 text-left transition-colors hover:border-accent disabled:opacity-60"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold">{d.label}</span>
                <span className="shrink-0 text-[11px] font-semibold text-accent opacity-80 group-hover:opacity-100">{busy === d.email ? <Spinner /> : "Sign in"}</span>
              </div>
              <div className="mt-1 truncate text-[11px] text-mist">{d.note}</div>
              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-sky">
                <span className="break-all">{d.email}</span>
                <span>{d.password}</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
      <ErrorNote>{login.error}</ErrorNote>
      <button onClick={() => setConfirm(true)} className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-mist hover:text-ink">
        <RotateCcw size={13} /> Reset demo data
      </button>
      <Modal open={confirm} onClose={() => setConfirm(false)}>
        <h2 className="text-[22px]">Reset demo data?</h2>
        <p className="mt-2 text-[14px] text-mist">
          This restores every demo account, posting, event and message to the starting state and signs you out. It only affects this browser.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={async () => {
              await reset.run();
              setConfirm(false);
              go("#/login");
            }}
            className={btn.primary}
          >
            {reset.pending && <Spinner />} Reset
          </button>
          <button onClick={() => setConfirm(false)} className={btn.ghost}>
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}
