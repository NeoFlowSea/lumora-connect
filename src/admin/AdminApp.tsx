/* STUB: owned by the admin-panel subagent. Renders the admin area for #/admin/<section>. */
export function AdminApp({ path }: { path: string[] }) {
  return <div className="p-10 text-mist">Admin area is being built. Section: {path.join("/") || "overview"}</div>;
}
