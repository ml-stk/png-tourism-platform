import { Pool } from 'pg';
import type { DestinationProjection } from '../domain/destination-projection';
import type { ProvinceCode } from '../domain/types';

export class PostgresDestinationProjectionRepository {
  constructor(private readonly pool: Pool) {}

  async listPublished(provinceCode?: ProvinceCode): Promise<DestinationProjection[]> {
    const values: unknown[] = [];
    const where = ["d.publication_status='published'"];
    if (provinceCode) { values.push(provinceCode); where.push(`d.province_code=$${values.length}`); }
    const r = await this.pool.query(`
      select d.id,d.slug,d.name,d.province_code,d.description,d.latitude,d.longitude,d.content_version,d.updated_at,
        c.id content_id,c.title content_title,c.summary content_summary,c.body content_body,c.version content_version_number,c.updated_at content_updated_at,
        coalesce(json_agg(json_build_object('id',m.id,'kind',m.kind,'publicUrl',m.public_url,'altText',m.alt_text,'caption',m.caption,'width',m.width,'height',m.height,'version',m.version,'updatedAt',m.updated_at) order by dm.sort_order) filter (where m.id is not null),'[]'::json) media
      from destinations d
      left join destination_content_links dcl on dcl.destination_id=d.id
      left join content_items c on c.id=dcl.content_id and c.publication_status='published'
      left join destination_media dm on dm.destination_id=d.id
      left join media_assets m on m.id=dm.media_asset_id and m.publication_status='published'
      where ${where.join(' and ')}
      group by d.id,c.id order by d.name`, values);
    return r.rows.map(row => this.map(row));
  }

  async getPublished(slug: string): Promise<DestinationProjection | null> {
    const r = await this.pool.query(`select d.id,d.slug,d.name,d.province_code,d.description,d.latitude,d.longitude,d.content_version,d.updated_at,
      c.id content_id,c.title content_title,c.summary content_summary,c.body content_body,c.version content_version_number,c.updated_at content_updated_at,
      coalesce(json_agg(json_build_object('id',m.id,'kind',m.kind,'publicUrl',m.public_url,'altText',m.alt_text,'caption',m.caption,'width',m.width,'height',m.height,'version',m.version,'updatedAt',m.updated_at) order by dm.sort_order) filter (where m.id is not null),'[]'::json) media
      from destinations d left join destination_content_links dcl on dcl.destination_id=d.id
      left join content_items c on c.id=dcl.content_id and c.publication_status='published'
      left join destination_media dm on dm.destination_id=d.id
      left join media_assets m on m.id=dm.media_asset_id and m.publication_status='published'
      where d.slug=$1 and d.publication_status='published' group by d.id,c.id order by d.name limit 1`, [slug]);
    return r.rows[0] ? this.map(r.rows[0]) : null;
  }

  private map(r: any): DestinationProjection {
    const updatedAt = new Date(r.updated_at).toISOString();
    const contentUpdatedAt = r.content_updated_at ? new Date(r.content_updated_at).toISOString() : updatedAt;
    const age = Date.now() - Math.max(Date.parse(updatedAt), Date.parse(contentUpdatedAt));
    return {
      id: r.id, slug: r.slug, name: r.name, provinceCode: r.province_code as ProvinceCode, description: r.description ?? undefined,
      latitude: r.latitude ?? undefined, longitude: r.longitude ?? undefined, contentVersion: Number(r.content_version), updatedAt,
      freshness: age > 1000 * 60 * 60 * 24 * 30 ? 'stale' : 'fresh',
      content: r.content_id ? { id: r.content_id, title: r.content_title, summary: r.content_summary ?? undefined, body: r.content_body ?? undefined, version: Number(r.content_version_number), updatedAt: contentUpdatedAt } : undefined,
      media: Array.isArray(r.media) ? r.media.map((m: any) => ({ ...m, updatedAt: new Date(m.updatedAt).toISOString(), version: Number(m.version) })) : [],
      qrPath: `/destination/${r.slug}`,
      offlineCacheKey: `destination:${r.id}:v${Number(r.content_version)}`,
      provenance: { source: 'governed-content', generatedAt: new Date().toISOString(), published: true },
    };
  }
}
