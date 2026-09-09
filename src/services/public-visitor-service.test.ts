import { describe, expect, it } from 'vitest';
import { PublicVisitorService } from './public-visitor-service';
import type { ContentItem, Destination, Operator } from '../domain/types';
const destination = (publicationStatus: Destination['publicationStatus']): Destination => ({ id:'d1',name:'Kokopo',slug:'kokopo',provinceCode:'EAST_NEW_BRITAIN',publicationStatus,contentVersion:1,updatedAt:'2026-09-09T00:00:00.000Z' });
const content = (publicationStatus: ContentItem['publicationStatus']): ContentItem => ({ id:'c1',type:'experience',title:'Reef',slug:'reef',publicationStatus,version:1,updatedAt:'2026-09-09T00:00:00.000Z' });
const operator = (status: Operator['status'], complianceStatus: Operator['complianceStatus'], tradingName?: string): Operator => ({ id:'o1',legalName:'Private Legal Entity',tradingName,provinceCode:'NCD',status,complianceStatus,createdAt:'2026-09-09T00:00:00.000Z',updatedAt:'2026-09-09T00:00:00.000Z' });
function service(overrides: any = {}) { return new PublicVisitorService({ destinations:{ list:async()=>({items:[destination('published'),destination('draft')]}),getById:async()=>destination('published') }, content:{ list:async()=>({items:[content('published'),content('review')]}),getById:async()=>content('published') }, operators:{ list:async()=>({items:[operator('active','compliant','Public Tours'),operator('active','conditional','Hidden Tours'),operator('closed','compliant','Closed Tours')]}),getById:async()=>operator('active','compliant','Public Tours') }, ...overrides }); }
describe('PublicVisitorService',()=>{
  it('requests published destinations and never exposes drafts',async()=>{const result=await service().destinationsList();expect(result.items).toHaveLength(1);expect(result.items[0].publicationStatus).toBe('published');});
  it('requests published content and never exposes review content',async()=>{const result=await service().contentList();expect(result.items).toHaveLength(1);expect(result.items[0].publicationStatus).toBe('published');});
  it('exposes only compliant active operators with trading names',async()=>{const result=await service().operatorsList();expect(result.items.map((item)=>item.tradingName)).toEqual(['Public Tours']);});
  it('rejects unpublished destination detail',async()=>{const svc=service({destinations:{list:async()=>({items:[]}),getById:async()=>destination('draft')}});await expect(svc.destination('d1')).rejects.toMatchObject({code:'NOT_FOUND'});});
  it('returns a deliberately limited operator profile',async()=>{const result=await service().operator('o1');expect(result).toEqual({id:'o1',tradingName:'Public Tours',provinceCode:'NCD'});expect(result).not.toHaveProperty('legalName');expect(result).not.toHaveProperty('complianceStatus');});
});
