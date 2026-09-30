export const schemaContractQuery = String.raw`
with app_schemas as (
  select unnest(array['public','analytics','gis','commerce','distribution','gateway']) as schema_name
), target_relations(schema_name, relation_name) as (
  values
    ('analytics','operator_snapshot'), ('analytics','visitor_event_fact'),
    ('analytics','daily_metric_fact'), ('analytics','metric_definitions'),
    ('analytics','etl_runs'), ('analytics','province_tourism_intelligence'),
    ('analytics','destination_performance'), ('analytics','engagement_trends_30d'),
    ('analytics','executive_dashboard'), ('gis','tourism_geo_asset'),
    ('gis','layer_definitions'), ('gis','public_geojson_assets'),
    ('public','sme_profiles'), ('public','sme_assessments'),
    ('public','sme_development_programs'), ('public','sme_program_enrolments'),
    ('public','tia_memberships'), ('public','tia_membership_events'),
    ('public','regulatory_licenses'), ('public','regulatory_inspections'),
    ('public','regulatory_compliance_actions'), ('public','regulatory_status_events'),
    ('distribution','channels'), ('distribution','publications'),
    ('distribution','partners'), ('distribution','partner_channel_bindings'),
    ('distribution','publication_events'), ('distribution','partner_events'),
    ('commerce','payment_providers'), ('commerce','transactions'),
    ('gateway','api_clients'), ('gateway','api_keys'),
    ('gateway','routes'), ('gateway','request_log')
), relations as (
  select n.nspname as schema_name, c.relname as object_name,
    case c.relkind when 'r' then 'table' when 'p' then 'partitioned_table'
      when 'v' then 'view' when 'm' then 'materialized_view' else c.relkind::text end as object_type,
    c.relrowsecurity as rls,
    coalesce((select md5(string_agg(
      a.attname || ':' || pg_catalog.format_type(a.atttypid,a.atttypmod) || ':' ||
      a.attnotnull::text || ':' || a.attidentity::text || ':' || a.attgenerated::text || ':' ||
      coalesce(pg_get_expr(d.adbin,d.adrelid),''), E'\n' order by a.attnum))
      from pg_attribute a left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum
      where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped), md5('')) as columns_hash,
    (select count(*) from pg_attribute a where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped) as column_count,
    coalesce((select md5(string_agg(con.conname || ':' || con.contype::text || ':' ||
      regexp_replace(pg_get_constraintdef(con.oid,true), E'\\s+', ' ', 'g'), E'\n' order by con.conname))
      from pg_constraint con where con.conrelid=c.oid and con.contype <> 'n'), md5('')) as constraints_hash,
    (select count(*) from pg_constraint con where con.conrelid=c.oid and con.contype <> 'n') as constraint_count,
    coalesce((select md5(string_agg(ic.relname || ':' ||
      regexp_replace(pg_get_indexdef(i.indexrelid), E'\\s+', ' ', 'g'), E'\n' order by ic.relname))
      from pg_index i join pg_class ic on ic.oid=i.indexrelid where i.indrelid=c.oid), md5('')) as indexes_hash,
    (select count(*) from pg_index i where i.indrelid=c.oid) as index_count,
    coalesce((select md5(string_agg(
      (case when acl.grantee=0 then 'PUBLIC' when acl.grantee=c.relowner then 'OWNER' else pg_get_userbyid(acl.grantee) end) || ':' ||
      acl.privilege_type || ':' || acl.is_grantable::text, E'\n'
      order by case when acl.grantee=0 then 'PUBLIC' when acl.grantee=c.relowner then 'OWNER' else pg_get_userbyid(acl.grantee) end,
      acl.privilege_type, acl.is_grantable::text))
      from aclexplode(coalesce(c.relacl, acldefault('r',c.relowner))) acl), md5('')) as acl_hash
  from target_relations tr
  left join pg_namespace n on n.nspname=tr.schema_name
  left join pg_class c on c.relnamespace=n.oid and c.relname=tr.relation_name
    and c.relkind in ('r','p','v','m')
  where c.oid is not null
), missing_relations as (
  select tr.schema_name, tr.relation_name as object_name
  from target_relations tr
  where not exists (
    select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname=tr.schema_name and c.relname=tr.relation_name and c.relkind in ('r','p','v','m')
  )
), functions as (
  select n.nspname as schema_name, p.proname as object_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as result_type,
    l.lanname as language, p.provolatile as volatility,
    p.prosecdef as security_definer, p.proleakproof as leakproof,
    coalesce(array_to_string(p.proconfig,E'\n'),'') as settings,
    md5(regexp_replace(trim(p.prosrc), E'\\s+', '', 'g')) as body_hash,
    coalesce((select md5(string_agg(
      (case when acl.grantee=0 then 'PUBLIC' when acl.grantee=p.proowner then 'OWNER' else pg_get_userbyid(acl.grantee) end) || ':' ||
      acl.privilege_type || ':' || acl.is_grantable::text, E'\n'
      order by case when acl.grantee=0 then 'PUBLIC' when acl.grantee=p.proowner then 'OWNER' else pg_get_userbyid(acl.grantee) end,
      acl.privilege_type, acl.is_grantable::text))
      from aclexplode(coalesce(p.proacl, acldefault('f',p.proowner))) acl), md5('')) as acl_hash
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  join pg_language l on l.oid=p.prolang
  where n.nspname in (select schema_name from app_schemas)
    and p.prokind in ('f','p')
    and (p.proname like 'regulatory_%' or p.proname like 'tia_%'
      or p.proname in ('refresh_daily_metrics','sync_registry_geo_assets',
        'validate_client_scope_grant','reject_disabled_key_use','prevent_request_log_mutation',
        'validate_client_status_transition','revoke_keys_for_revoked_client',
        'prevent_api_key_reactivation'))
), views as (
  select n.nspname as schema_name, c.relname as object_name,
    md5(regexp_replace(pg_get_viewdef(c.oid,true), E'\\s+', ' ', 'g')) as definition_hash
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  join target_relations tr on tr.schema_name=n.nspname and tr.relation_name=c.relname
  where c.relkind in ('v','m')
), triggers as (
  select n.nspname as schema_name, c.relname as relation_name, t.tgname as trigger_name,
    md5(regexp_replace(pg_get_triggerdef(t.oid,true), E'\\s+', ' ', 'g')) as definition_hash
  from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace
  join target_relations tr on tr.schema_name=n.nspname and tr.relation_name=c.relname
  where not t.tgisinternal
), policies as (
  select schemaname as schema_name, tablename as relation_name, policyname,
    md5(concat_ws('|',permissive,roles::text,cmd,coalesce(qual,''),coalesce(with_check,''))) as definition_hash
  from pg_policies
  where schemaname in (select schema_name from app_schemas)
    and exists (select 1 from target_relations tr where tr.schema_name=schemaname and tr.relation_name=tablename)
)
select jsonb_build_object(
  'server_version', current_setting('server_version'),
  'relations', coalesce((select jsonb_agg(to_jsonb(x) order by schema_name,object_name) from relations x),'[]'::jsonb),
  'missing_relations', coalesce((select jsonb_agg(to_jsonb(x) order by schema_name,object_name) from missing_relations x),'[]'::jsonb),
  'functions', coalesce((select jsonb_agg(to_jsonb(x) order by schema_name,object_name,arguments) from functions x),'[]'::jsonb),
  'views', coalesce((select jsonb_agg(to_jsonb(x) order by schema_name,object_name) from views x),'[]'::jsonb),
  'triggers', coalesce((select jsonb_agg(to_jsonb(x) order by schema_name,relation_name,trigger_name) from triggers x),'[]'::jsonb),
  'policies', coalesce((select jsonb_agg(to_jsonb(x) order by schema_name,relation_name,policyname) from policies x),'[]'::jsonb)
) as contract;
`;

if (process.argv.includes('--sql')) process.stdout.write(schemaContractQuery);
