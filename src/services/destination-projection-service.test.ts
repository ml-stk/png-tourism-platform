import { describe, expect, it, vi } from 'vitest';
import { DestinationProjectionService } from './destination-projection-service';

describe('DestinationProjectionService',()=>{
 it('returns only repository projections',async()=>{const repo={listPublished:vi.fn().mockResolvedValue([{id:'d1',slug:'kokoda',name:'Kokoda Track',provinceCode:'ORO',contentVersion:3,updatedAt:'2026-09-10T00:00:00.000Z',freshness:'fresh',media:[],qrPath:'/destination/kokoda',offlineCacheKey:'destination:d1:v3',provenance:{source:'governed-content',generatedAt:'2026-09-10T00:00:00.000Z',published:true}}]),getPublished:vi.fn()};const service=new DestinationProjectionService(repo as any);const result=await service.list('ORO');expect(result[0].name).toBe('Kokoda Track');expect(repo.listPublished).toHaveBeenCalledWith('ORO');});
 it('rejects unpublished or missing destination references',async()=>{const repo={listPublished:vi.fn(),getPublished:vi.fn().mockResolvedValue(null)};const service=new DestinationProjectionService(repo as any);await expect(service.get('draft-destination')).rejects.toMatchObject({code:'NOT_FOUND'});});
});
