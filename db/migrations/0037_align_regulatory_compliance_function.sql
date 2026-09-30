-- Preserve the production behavior while making the fresh-schema definition canonical.
create or replace function regulatory_sync_operator_compliance()
returns integer
language plpgsql
set search_path = public, pg_temp
as $$
declare affected integer;
begin
  update operators o
  set compliance_status = case
    when exists (
      select 1 from regulatory_compliance_actions a
      where a.operator_id=o.id and a.status in ('open','in_progress','overdue')
    ) then 'non_compliant'::compliance_status
    when exists (
      select 1 from regulatory_licenses l
      where l.operator_id=o.id and l.status='expired'
    ) then 'non_compliant'::compliance_status
    when exists (
      select 1 from regulatory_licenses l
      where l.operator_id=o.id and l.status='approved'
        and (l.expires_at is null or l.expires_at >= now())
    ) then 'compliant'::compliance_status
    else 'unknown'::compliance_status
  end,
  updated_at=now()
  where exists (select 1 from regulatory_licenses l where l.operator_id=o.id)
     or exists (select 1 from regulatory_compliance_actions a where a.operator_id=o.id);
  get diagnostics affected = row_count;
  return affected;
end;
$$;
