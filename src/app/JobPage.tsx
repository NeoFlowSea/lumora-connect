/* Full opportunity page, #/jobs/:id. Owned by the jobs agent (dict: jobs). */
export function JobPage({ id }: { id: string }) {
  return <div className="p-10">Job {id}</div>;
}
