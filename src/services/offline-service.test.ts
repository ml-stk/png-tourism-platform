import { describe, expect, it } from 'vitest';
import { OfflineService } from './offline-service';

const destination={id:'dest-1',name:'Kokoda',slug:'kokoda',provinceCode:'ORO',description:'Track',latitude:-8,longitude:147,publicationStatus:'published',updatedAt:'2026-09-09T00:00:00.000Z',contentVersion:3};
const content={id:'content-1',type:'experience',title:'Kokoda Experience',slug:'kokoda-experience',provinceCode:'ORO',summary:'Walk the track',body:'Guided experience',publicationStatus:'published',publishedAt:'2026-09-09T00:00:00.000Z',publicationSource:'tpa',updatedAt:'2026-09-09T00:00:00.000Z',version:2};
function deps(){return {destinations:{list:async()=>({items:[destination],nextCursor:undefined}),getById:async()=>destination,create:async()=>destination},content:{list:async()=>({items:[content],nextCursor:undefined}),getById:async()=>content,create:async()=>content,setPublication:async()=>content}} as any;}

describe('OfflineService public delivery',()=>{
 it('builds province-scoped published manifests with stable versions and timestamps',async()=>{const service=new OfflineService(deps());const manifest=await service.buildManifest({channel:'provincial',provinceCode:'ORO',now:new Date('2026-09-09T12:00:00.000Z')});expect(manifest.source).toBe('public-published-content');expect(manifest.provinceCode).toBe('ORO');expect(manifest.records.map(r=>r.version)).toEqual(['dest-1:3','content-1:2']);expect(manifest.records.every(r=>r.updatedAt==='2026-09-09T00:00:00.000Z')).toBe(true);});
 it('requires province for provincial channel and rejects empty QR targets',async()=>{const service=new OfflineService(deps());await expect(service.buildManifest({channel:'provincial'} as any)).rejects.toThrow('Province code is required');expect(()=>service.createQrHandoff('destination','   ')).toThrow('QR handoff target is required');});
 it('creates a versioned deep-link handoff',()=>{const service=new OfflineService(deps());expect(service.createQrHandoff('content','content-1')).toEqual({version:1,targetType:'content',targetId:'content-1',uri:'pngtourism://handoff/content/content-1'});});
});
