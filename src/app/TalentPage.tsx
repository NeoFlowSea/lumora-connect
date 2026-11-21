/* Talent page for signed-in users, #/app/talent/:id. Owned by the jobs agent (dict: jobs). */
export function TalentPage({ id }: { id: string }) {
  return <div className="p-10">Talent {id}</div>;
}
