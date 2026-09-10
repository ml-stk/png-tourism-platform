import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import type { MediaAsset } from '../domain/content-studio';
import type { ProvinceCode, PublicationStatus } from '../domain/types';

export class PostgresMediaRepository {
  constructor(private readonly pool: Pool) {}
  async create(input: Omit<MediaAsset, 'id' | 'updatedAt'>): Promise<MediaAsset> {
    const id = randomUUID(); const updatedAt = new Date().toISOString();
    const r = await this.pool.query(`insert into media_assets(id,kind,storage_key,public_url,alt_text,caption,width,height,mime_type,byte_size,checksum,province_code,publication_status,version,updated_at) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) returning *`, [id,input.kind,input.storageKey,input.publicUrl??null,input.altText,input.caption??null,input.width??null,input.height??null,input.mimeType,input.byteSize??null,input.checksum??null,input.provinceCode??null,input.publicationStatus,input.version,updatedAt]);
    return map(r.rows[0]);
  }
  async setPublication(id: string, status: PublicationStatus) { const r=await this.pool.query('update media_assets set publication_status=$1,version=version+1,updated_at=now() where id=$2 returning *',[status,id]); return r.rows[0]?map(r.rows[0]):null; }
  async link(destinationId:string, mediaAssetId:string, sortOrder:number) { await this.pool.query(`insert into destination_media(destination_id,media_asset_id,sort_order) values($1,$2,$3) on conflict(destination_id,media_asset_id) do update set sort_order=excluded.sort_order`,[destinationId,mediaAssetId,sortOrder]); }
}
function map(r:any):MediaAsset{return{id:r.id,kind:r.kind,storageKey:r.storage_key,publicUrl:r.public_url??undefined,altText:r.alt_text,caption:r.caption??undefined,width:r.width??undefined,height:r.height??undefined,mimeType:r.mime_type,byteSize:r.byte_size?Number(r.byte_size):undefined,checksum:r.checksum??undefined,provinceCode:r.province_code as ProvinceCode|undefined,publicationStatus:r.publication_status,version:Number(r.version),updatedAt:new Date(r.updated_at).toISOString()};}
