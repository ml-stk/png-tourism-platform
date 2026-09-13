-- NTDP GIS maturation: authoritative layer metadata, registry synchronisation, and GeoJSON query support
create table if not exists gis.layer_definitions (
  layer_code text primary key,
  name text not null,
  description text,
  source_domain text not null,
  geometry_type text not null check (geometry_type in ('Point','LineString','Polygon','MultiPolygon')),
  authoritative boolean not null default true,
  public_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into gis.layer_definitions (layer_code,name,description,source_domain,geometry_type,authoritative,public_default) values
 ('operators','Tourism Operators','Authoritative operator locations sourced from the National Tourism Registry','registry','Point',true,false),
 ('destinations','Tourism Destinations','Authoritative destination locations maintained by the tourism platform','content','Point',true,true),
 ('attractions','Tourism Attractions','Tourism attraction locations and related metadata','gis','Point',false,true),
 ('infrastructure','Tourism Infrastructure','Tourism-supporting infrastructure locations','gis','Point',false,true),
 ('services','Tourism Services','Tourism-related service locations','gis','Point',false,true),
 ('events','Tourism Events','Tourism event locations','content','Point',false,true)
on conflict (layer_code) do update set name=excluded.name, description=excluded.description, source_domain=excluded.source_domain, geometry_type=excluded.geometry_type, authoritative=excluded.authoritative, public_default=excluded.public_default, updated_at=now();

alter table gis.tourism_geo_asset add column if not exists layer_code text references gis.layer_definitions(layer_code);
alter table gis.tourism_geo_asset add column if not exists visibility_scope text not null default 'internal' check (visibility_scope in ('internal','provincial','public'));
create index if not exists idx_gis_geo_asset_layer_public on gis.tourism_geo_asset(layer_code,is_public,visibility_scope);

update gis.tourism_geo_asset set layer_code=asset_type where layer_code is null and asset_type in ('operator','destination','attraction','infrastructure','service','event');
update gis.tourism_geo_asset set visibility_scope=case when is_public then 'public' else 'internal' end;

create or replace function gis.sync_registry_geo_assets()
returns integer
language plpgsql
security definer
set search_path = public, gis
as $$
declare affected integer := 0;
begin
  insert into gis.tourism_geo_asset (asset_type,source_id,name,province_code,latitude,longitude,properties,is_public,layer_code,visibility_scope)
  select 'operator',o.id,o.legal_name,o.province_code,o.latitude,o.longitude,
         jsonb_build_object('trading_name',o.trading_name,'status',o.status,'compliance_status',o.compliance_status),
         false,'operators','internal'
  from operators o
  where o.latitude is not null and o.longitude is not null
  on conflict (asset_type,source_id) do update set
    name=excluded.name, province_code=excluded.province_code, latitude=excluded.latitude, longitude=excluded.longitude,
    properties=excluded.properties, layer_code=excluded.layer_code, updated_at=now();
  get diagnostics affected = row_count;

  insert into gis.tourism_geo_asset (asset_type,source_id,name,province_code,latitude,longitude,properties,is_public,layer_code,visibility_scope)
  select 'destination',d.id,d.name,d.province_code,d.latitude,d.longitude,
         jsonb_build_object('slug',d.slug,'publication_status',d.publication_status),
         d.publication_status='published','destinations',case when d.publication_status='published' then 'public' else 'internal' end
  from destinations d
  where d.latitude is not null and d.longitude is not null
  on conflict (asset_type,source_id) do update set
    name=excluded.name, province_code=excluded.province_code, latitude=excluded.latitude, longitude=excluded.longitude,
    properties=excluded.properties, is_public=excluded.is_public, layer_code=excluded.layer_code, visibility_scope=excluded.visibility_scope, updated_at=now();
  get diagnostics affected = affected + row_count;
  return affected;
end;
$$;

create or replace view gis.public_geojson_assets as
select jsonb_build_object(
  'type','Feature',
  'id',g.id,
  'geometry',st_asgeojson(g.location)::jsonb,
  'properties',jsonb_build_object('id',g.id,'assetType',g.asset_type,'layerCode',g.layer_code,'name',g.name,'provinceCode',g.province_code,'properties',g.properties)
) as feature,
 g.id,g.layer_code,g.province_code,g.name
from gis.tourism_geo_asset g
where g.is_public=true and g.visibility_scope='public';

comment on table gis.layer_definitions is 'Governed NTDP GIS layer catalogue and source-of-truth metadata';
comment on function gis.sync_registry_geo_assets() is 'Synchronises geocoded Registry operators and published destinations into the governed GIS asset store';
