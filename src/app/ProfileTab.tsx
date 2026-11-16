import { useState } from "react";
import { Building2, LogOut, Pencil, Repeat, Trophy } from "lucide-react";
import { companies, hackathons, me, opportunities, talents } from "../data";
import { actions, useStore } from "../lib/store";
import { Shield } from "../components/Logo";
import { Pill, btn, initials, useToast } from "../components/ui";
import { go } from "../lib/router";

export function ProfileTab() {
  const { role, liked, applied, registered } = useStore();
  const toast = useToast();
  const [edit, setEdit] = useState(false);
  const isCo = role === "company";
  const t = me.talent;
  const c = me.company;

  const likedNames = isCo
    ? talents.filter((x) => liked.includes(x.id)).map((x) => ({ id: x.id, name: x.name, sub: x.cat }))
    : companies.filter((x) => liked.includes(x.id)).map((x) => ({ id: x.id, name: x.name, sub: x.industry }));
  const apps = opportunities.filter((o) => applied.includes(o.id));
  const regs = hackathons.filter((h) => registered.includes(h.id));

  function switchRole() {
    actions.setRole(isCo ? "talent" : "company");
    toast(isCo ? "Switched to talent view" : "Switched to company view");
  }
  function signOut() {
    actions.signOut();
    go("#/");
  }

  const field = (label: string, value: string) => (
    <label className="grid gap-1 text-[12px] font-semibold text-mist">
      {label}
      {edit ? (
        <input defaultValue={value} className="rounded-xl border border-line px-3 py-2 text-[15px] font-normal text-ink outline-none focus:border-sky" />
      ) : (
        <span className="text-[15px] font-normal text-ink">{value}</span>
      )}
    </label>
  );

  return (
    <div className="grid gap-6 md:grid-cols-[360px_1fr]">
      {/* card */}
      <div>
        <div className="overflow-hidden rounded-3xl border border-line bg-white">
          <div className="h-28 bg-gradient-to-br from-blue to-sky" />
          <div className="-mt-10 px-6 pb-6">
            <div className="grid h-20 w-20 place-items-center rounded-full border-4 border-white bg-ink font-display text-[22px] text-white">
              {isCo ? <Building2 size={30} /> : initials(t.name)}
            </div>
            <h1 className="mt-4 text-[24px]">{isCo ? c.name : t.name}</h1>
            <p className="text-[14px] text-mist">{isCo ? `${c.industry}, ${c.city}, ${c.size}` : `${t.cat}, ${t.city}, ${t.age}`}</p>
            {!isCo && (
              <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-tint px-3 py-2.5 text-[13px]">
                <Trophy size={16} className="shrink-0 text-blue" />
                <span className="min-w-0 truncate">
                  <b>{t.place}</b>, {t.event}
                </span>
                <span className="ml-auto flex shrink-0 items-center gap-1 text-[11px] text-mist">
                  <Shield size={9} mono="#1a4ba8" /> verified
                </span>
              </div>
            )}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                [liked.length, isCo ? "liked" : "saved"],
                [apps.length, "applied"],
                [regs.length, "hackathons"],
              ].map(([n, l]) => (
                <div key={l} className="rounded-xl bg-cloud py-2">
                  <div className="font-display text-[20px] text-blue">{n}</div>
                  <div className="text-[11px] text-mist">{l}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={() => setEdit((e) => !e)} className={`${btn.sm} border border-line hover:bg-cloud`}>
                <Pencil size={14} /> {edit ? "Cancel" : "Edit"}
              </button>
              <button onClick={switchRole} className={`${btn.sm} border border-line hover:bg-cloud`}>
                <Repeat size={14} /> Switch to {isCo ? "talent" : "company"}
              </button>
              <button onClick={signOut} className={`${btn.sm} text-bad hover:bg-cloud`}>
                <LogOut size={14} /> Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* details */}
      <div className="grid gap-6">
        <section className="rounded-3xl border border-line bg-white p-6">
          <h2 className="text-[18px]">{isCo ? "Company" : "About"}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {isCo ? (
              <>
                {field("Company", c.name)}
                {field("Industry", c.industry)}
                {field("City", c.city)}
                {field("Contact", c.contact)}
                <div className="sm:col-span-2">{field("About", c.about)}</div>
              </>
            ) : (
              <>
                {field("Name", t.name)}
                {field("City", t.city)}
                {field("Track", t.cat)}
                {field("Availability", t.avail)}
                {field("Telegram", t.contact)}
                {field("Project", t.project)}
                <div className="sm:col-span-2">{field("Bio", t.bio)}</div>
              </>
            )}
          </div>
          {!isCo && (
            <div className="mt-5">
              <div className="text-[12px] font-semibold text-mist">Skills</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {t.skills.map((s) => (
                  <span key={s} className="rounded-md bg-tint px-2 py-1 text-[12px] font-semibold text-blue">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {edit && (
            <button
              onClick={() => {
                setEdit(false);
                toast("Profile saved");
              }}
              className={`${btn.primary} mt-6`}
            >
              Save changes
            </button>
          )}
        </section>

        <section className="rounded-3xl border border-line bg-white p-6">
          <h2 className="text-[18px]">{isCo ? "Talent you liked" : "Companies you liked"}</h2>
          {likedNames.length === 0 ? (
            <p className="mt-2 text-[14px] text-mist">Nothing yet. Swipe right to save someone here.</p>
          ) : (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {likedNames.map((x) => (
                <li key={x.id} className="flex items-center gap-3 rounded-xl bg-cloud p-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-blue text-[12px] font-bold text-white">{initials(x.name)}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-semibold">{x.name}</span>
                    <span className="block text-[12px] text-mist">{x.sub}</span>
                  </span>
                  {x.id.charCodeAt(x.id.length - 1) % 2 === 0 && (
                    <span className="ml-auto">
                      <Pill tone="good">Match</Pill>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {!isCo && (
          <section className="rounded-3xl border border-line bg-white p-6">
            <h2 className="text-[18px]">Applications</h2>
            {apps.length === 0 ? (
              <p className="mt-2 text-[14px] text-mist">No applications yet. Open Opportunities and apply with one click.</p>
            ) : (
              <ul className="mt-4 divide-y divide-line">
                {apps.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-3 py-3">
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-semibold">{o.title}</span>
                      <span className="block text-[12px] text-mist">{o.co}</span>
                    </span>
                    <Pill tone="tint">Pending</Pill>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <section className="rounded-3xl border border-line bg-white p-6">
          <h2 className="text-[18px]">{isCo ? "Sponsored hackathons" : "Hackathons"}</h2>
          {regs.length === 0 ? (
            <p className="mt-2 text-[14px] text-mist">{isCo ? "No sponsorships yet." : "Not registered for anything upcoming. Your past results stay on the profile."}</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {regs.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-3 py-3">
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-semibold">{h.name}</span>
                    <span className="block text-[12px] text-mist">
                      {h.dateLabel}, {h.city}
                    </span>
                  </span>
                  <Pill tone="good">Registered</Pill>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
