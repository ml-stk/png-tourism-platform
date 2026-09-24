import { createApiServer } from './api';
import { handleIndustryApi } from './industry-api';
import { handleOperatorRegistrationApi } from './operator-registration-api';
import { handleVisitorEngagementApi } from './visitor-engagement-api';
import { handlePassportApi } from './passport-api';
import { handleCommandCentreApi } from './command-centre-api';
import { handleCampaignEventApi } from './campaign-event-api';
import { handleContentStudioApi } from './content-studio-api';
import { handleDestinationPublicApi } from './destination-public-api';
import { handleMediaApi } from './media-api';
import { handleNtdpEnterpriseApi } from './ntdp-enterprise-api';
import { handleNtdpRegulatoryApi } from './ntdp-regulatory-api';
import { handleNtdpDistributionApi } from './ntdp-distribution-api';
import { handleNtdpCommerceApi } from './ntdp-commerce-api';
import { handleNtdpApiGatewayApi } from './ntdp-api-gateway-api';
import { handleAiConciergePublicApi } from './ai-concierge-public-api';
import { NtdpApiGatewayService } from '../services/ntdp-api-gateway-service';
import { Pool } from 'pg';
import { applyCors } from './security';
import { healthResponse } from './health';
const port=Number(process.env.PORT||3000);const pool=new Pool({connectionString:process.env.DATABASE_URL});const gateway=new NtdpApiGatewayService(pool);const server=createApiServer();const existingHandler=server.listeners('request')[0] as (req:import('node:http').IncomingMessage,res:import('node:http').ServerResponse)=>void;server.removeListener('request',existingHandler);server.on('request',async(req,res)=>{if(!applyCors(req,res))return;const started=Date.now();const requestId=req.headers['x-request-id']?.toString()||cryptoRandomId();const originalUrl=req.url||'/';try{const parsed=new URL(originalUrl,'http://localhost');if(req.method==='GET'&&parsed.pathname==='/health'){res.statusCode=200;res.setHeader('content-type','application/json; charset=utf-8');res.end(JSON.stringify(healthResponse()));return;}if(req.method==='POST'&&parsed.pathname==='/api/v1/ai/concierge'){await dispatch(req,res,existingHandler,undefined,undefined,undefined,originalUrl,gateway,started,requestId);return;}if(!originalUrl.startsWith('/api/v1/ntdp/gateway')){const auth=await gateway.authorizeRequest({method:req.method||'GET',path:parsed.pathname,apiKey:header(req,'x-api-key')});if(auth.routeKey!=='unregistered'){const status=await dispatch(req,res,existingHandler,auth.routeKey,auth.clientId,auth.apiKeyId,originalUrl,gateway,started,requestId);return status;}}
await dispatch(req,res,existingHandler,undefined,undefined,undefined,originalUrl,gateway,started,requestId);}catch(e:any){const status=e?.code==='UNAUTHORIZED'?401:e?.code==='FORBIDDEN'?403:e?.code==='RATE_LIMITED'?429:e?.code==='NOT_FOUND'?404:500;res.statusCode=status;res.setHeader('content-type','application/json; charset=utf-8');res.end(JSON.stringify({error:{code:e?.code||'INTERNAL_ERROR',message:status===500?'Internal server error':e.message},requestId}));await gateway.logRequest({requestId,method:req.method||'GET',path:originalUrl,statusCode:status,latencyMs:Date.now()-started}).catch(()=>{});}});server.listen(port,'0.0.0.0',()=>console.log(`PNG Tourism Platform API listening on :${port}`));

async function dispatch(req:import('node:http').IncomingMessage,res:import('node:http').ServerResponse,existingHandler:(req:import('node:http').IncomingMessage,res:import('node:http').ServerResponse)=>void,routeKey:string|undefined,clientId:string|undefined,apiKeyId:string|undefined,originalUrl:string,gateway:NtdpApiGatewayService,started:number,requestId:string){
  const parsed=new URL(originalUrl,'http://localhost');
  if(routeKey==='partner-destinations'||routeKey==='partner-content'){req.url=originalUrl.replace(/^\/api\/v1\/partner\//,'/api/v1/public/');}
  await routeHandlers(req,res);
  await gateway.logRequest({requestId,clientId,apiKeyId,method:req.method||'GET',routeKey,path:parsed.pathname,statusCode:res.statusCode,latencyMs:Date.now()-started}).catch(()=>{});
}
async function routeHandlers(req:import('node:http').IncomingMessage,res:import('node:http').ServerResponse){if(await handleNtdpApiGatewayApi(req,res))return;if(await handleNtdpDistributionApi(req,res))return;if(await handleNtdpCommerceApi(req,res))return;if(await handleNtdpRegulatoryApi(req,res))return;if(await handleNtdpEnterpriseApi(req,res))return;if(await handleAiConciergePublicApi(req,res))return;if(await handleOperatorRegistrationApi(req,res))return;if(await handleIndustryApi(req,res))return;if(await handleVisitorEngagementApi(req,res))return;if(await handlePassportApi(req,res))return;if(await handleCommandCentreApi(req,res))return;if(await handleCampaignEventApi(req,res))return;if(await handleContentStudioApi(req,res))return;if(await handleDestinationPublicApi(req,res))return;if(await handleMediaApi(req,res))return;res.statusCode=404;res.end(JSON.stringify({error:{code:'NOT_FOUND',message:'Route not found'}}));}
function header(req:import('node:http').IncomingMessage,name:string){const value=req.headers[name];return Array.isArray(value)?value[0]:value?.toString();}
function cryptoRandomId(){return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,12)}`;}
