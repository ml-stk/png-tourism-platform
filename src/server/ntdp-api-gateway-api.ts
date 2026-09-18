import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Pool } from 'pg';
import { requirePermission } from '../auth/authorization';
import { authenticate } from './api';
import { NtdpApiGatewayService, type GatewayClientStatus, type GatewayClientType } from '../services/ntdp-api-gateway-service';

const pool=new Pool({connectionString:process.env.DATABASE_URL});
const service=new NtdpApiGatewayService(pool);

export async function handleNtdpApiGatewayApi(req:IncomingMessage,res:ServerResponse):Promise<boolean>{
  return handleNtdpApiGatewayApiWithService(req,res,service);
}

export async function handleNtdpApiGatewayApiWithService(req:IncomingMessage,res:ServerResponse,gatewayService:NtdpApiGatewayService):Promise<boolean>{
  const url=new URL(req.url||'/','http://localhost');
  if(!url.pathname.startsWith('/api/v1/ntdp/gateway'))return false;
  const requestId=req.headers['x-request-id']?.toString()||randomUUID();
  try{
    const context=await authenticate(req,requestId);
    if(req.method==='GET'&&url.pathname==='/api/v1/ntdp/gateway/routes'){requirePermission(context,'gateway:read');return send(res,200,{data:await gatewayService.routes(url.searchParams.get('status')||undefined),requestId});}
    if(req.method==='GET'&&url.pathname==='/api/v1/ntdp/gateway/clients'){requirePermission(context,'gateway:read');return send(res,200,{data:await gatewayService.clients(url.searchParams.get('status') as GatewayClientStatus||undefined),requestId});}
    if(req.method==='POST'&&url.pathname==='/api/v1/ntdp/gateway/clients'){requirePermission(context,'gateway:write');const body=await readJson(req);if(typeof body.name!=='string'||!body.name.trim())return fail(res,400,'VALIDATION_ERROR','name is required',requestId);return send(res,201,{data:await gatewayService.createClient({name:body.name.trim(),organisation:typeof body.organisation==='string'?body.organisation:undefined,contactEmail:typeof body.contactEmail==='string'?body.contactEmail:undefined,clientType:body.clientType as GatewayClientType|undefined,rateLimitPerMinute:typeof body.rateLimitPerMinute==='number'?body.rateLimitPerMinute:undefined,allowedScopes:Array.isArray(body.allowedScopes)?body.allowedScopes.filter((v):v is string=>typeof v==='string'):undefined,createdBy:context.user.id}),requestId});}
    if(req.method==='PATCH'&&url.pathname.match(/^\/api\/v1\/ntdp\/gateway\/clients\/[^/]+$/)){requirePermission(context,'gateway:write');const id=url.pathname.split('/').pop()!;const body=await readJson(req);if(!['pending','approved','suspended','revoked'].includes(String(body.status)))return fail(res,400,'VALIDATION_ERROR','Invalid client status',requestId);return send(res,200,{data:await gatewayService.transitionClient(id,body.status as GatewayClientStatus,context.user.id),requestId});}
    if(req.method==='GET'&&url.pathname==='/api/v1/ntdp/gateway/keys'){requirePermission(context,'gateway:read');return send(res,200,{data:await gatewayService.keys(url.searchParams.get('clientId')||undefined),requestId});}
    if(req.method==='POST'&&url.pathname==='/api/v1/ntdp/gateway/keys'){requirePermission(context,'gateway:write');const body=await readJson(req);if(typeof body.clientId!=='string')return fail(res,400,'VALIDATION_ERROR','clientId is required',requestId);return send(res,201,{data:await gatewayService.issueKey({clientId:body.clientId,label:typeof body.label==='string'?body.label:undefined,expiresAt:typeof body.expiresAt==='string'?body.expiresAt:undefined,createdBy:context.user.id}),requestId});}
    if(req.method==='DELETE'&&url.pathname.match(/^\/api\/v1\/ntdp\/gateway\/keys\/[^/]+$/)){requirePermission(context,'gateway:write');return send(res,200,{data:await gatewayService.revokeKey(url.pathname.split('/').pop()!,context.user.id),requestId});}
    if(req.method==='GET'&&url.pathname==='/api/v1/ntdp/gateway/usage'){requirePermission(context,'gateway:read');const limit=Number(url.searchParams.get('limit')||100);return send(res,200,{data:await gatewayService.usage(url.searchParams.get('clientId')||undefined,limit),requestId});}
    return fail(res,404,'NOT_FOUND','Gateway route not found',requestId);
  }catch(e:any){const status=e?.code==='UNAUTHORIZED'?401:e?.code==='FORBIDDEN'?403:e?.code==='NOT_FOUND'?404:e?.code==='VALIDATION_ERROR'?400:e?.code==='CONFLICT'?409:e?.code==='RATE_LIMITED'?429:500;return fail(res,status,e?.code||'INTERNAL_ERROR',status===500?'Internal server error':e.message,requestId,status===429?{'retry-after':'60'}:undefined);}
}
async function readJson(req:IncomingMessage){const chunks:Buffer[]=[];for await(const chunk of req)chunks.push(Buffer.from(chunk));try{const body=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(!body||typeof body!=='object'||Array.isArray(body))throw new Error();return body as Record<string,unknown>;}catch{const e:any=new Error('Invalid JSON body');e.code='VALIDATION_ERROR';throw e;}}
function send(res:ServerResponse,status:number,body:unknown,headers:Record<string,string>={}){res.statusCode=status;res.setHeader('content-type','application/json; charset=utf-8');for(const [key,value] of Object.entries(headers))res.setHeader(key,value);res.end(JSON.stringify(body));return true;}
function fail(res:ServerResponse,status:number,code:string,message:string,requestId:string,headers?:Record<string,string>){return send(res,status,{error:{code,message},requestId},headers);}
