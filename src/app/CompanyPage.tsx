/* Public company page, #/company/:id. Owned by the jobs agent (dict: jobs). */
export function CompanyPage({ id }: { id: string }) {
  return <div className="p-10">Company {id}</div>;
}
