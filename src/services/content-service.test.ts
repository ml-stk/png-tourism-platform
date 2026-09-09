import { describe, expect, it, vi } from 'vitest';
import { ContentService, DestinationService } from './content-service';
import type { ContentItem, Destination } from '../domain/types';

const audit={record:vi.fn(async()=>undefined)};
const destination: Destination = { id:'d1',name:'Kokoda',slug:'kokoda',provinceCode:'ORO',publicationStatus:'draft',description:'Trail',contentVersion:1,updatedAt:'2026-09-09T00:00:00.000Z' };
const content: ContentItem = { id:'c1',type:'destination',title:'Kokoda',slug:'kokoda',publicationStatus:'review',version:1,updatedAt:'2026-09-09T00:00:00.000Z',provinceCode:'ORO',summary:'Trail',body:'Description' };

describe('DestinationService',()=>{it('creates draft destinations and audits',async()=>{const repo:any={list:vi.fn(),getById:vi.fn(),save:vi.fn(async(x)=>x),update:vi.fn()};const s=new DestinationService(repo,audit);const r=await s.create({name:'Kokoda',slug:'Kokoda',provinceCode:'ORO',actorId:'u1'});expect(r.publicationStatus).toBe('draft');expect(r.contentVersion).toBe(1);expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({action:'destination.created'}));});it('rejects invalid publication transition',async()=>{const repo:any={getById:vi.fn(async()=>destination),update:vi.fn()};const s=new DestinationService(repo,audit);await expect(s.setPublication('d1','published','u1')).rejects.toMatchObject({code:'CONFLICT'});});});

describe('ContentService',()=>{it('requires review before publication',async()=>{const repo:any={getById:vi.fn(async()=>({...content,publicationStatus:'draft'})),update:vi.fn()};const s=new ContentService(repo,audit);await expect(s.setPublication('c1','published','u1')).rejects.toMatchObject({code:'CONFLICT'});});it('uses optimistic versioning and records publication provenance',async()=>{const repo:any={getById:vi.fn(async()=>content),update:vi.fn(async(x)=>x)};const s=new ContentService(repo,audit);const r=await s.setPublication('c1','published','u1');expect(repo.update).toHaveBeenCalledWith(expect.objectContaining({version:2,publicationStatus:'published',publishedBy:'u1'}),1);expect(r.version).toBe(2);expect(r.publishedBy).toBe('u1');});});
