/* Privacy policy and terms. Owned by the landing agent (dict: legal). */
export function Legal({ kind }: { kind: "privacy" | "terms" }) {
  return (
    <div className="mx-auto max-w-[760px] px-5 pb-24 pt-28">
      <h1 className="text-[32px]">{kind === "privacy" ? "Privacy" : "Terms"}</h1>
    </div>
  );
}
