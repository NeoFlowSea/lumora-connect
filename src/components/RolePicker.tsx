import { Building2, Sparkles } from "lucide-react";
import { Modal } from "./ui";
import { actions, type Role } from "../lib/store";
import { go } from "../lib/router";

export function RolePicker({ open, onClose }: { open: boolean; onClose: () => void }) {
  function choose(role: Role) {
    actions.setRole(role);
    onClose();
    go("#/app/swipe");
  }
  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="text-[26px]">Who are you here as?</h2>
      <p className="mt-2 text-[15px] text-mist">You can switch later from your profile. No sign-up needed for this preview.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => choose("talent")}
          className="group rounded-2xl border border-line p-5 text-left transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-sky hover:bg-tint"
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue text-white">
            <Sparkles size={20} />
          </span>
          <span className="mt-4 block font-display text-[17px]">Tech talent</span>
          <span className="mt-1 block text-[14px] text-mist">Swipe companies, apply to internships, join hackathons.</span>
        </button>
        <button
          onClick={() => choose("company")}
          className="group rounded-2xl border border-line p-5 text-left transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-sky hover:bg-tint"
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-paper">
            <Building2 size={20} />
          </span>
          <span className="mt-4 block font-display text-[17px]">Company</span>
          <span className="mt-1 block text-[14px] text-mist">Swipe verified talent, post roles, sponsor a hackathon.</span>
        </button>
      </div>
    </Modal>
  );
}
