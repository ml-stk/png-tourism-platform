import type { AiPolicy } from '../domain/ai';

const DEFAULT_PROVIDER = 'adapter';
const DEFAULT_MODEL = 'governed-adapter-v1';
const DEFAULT_PROMPT = 'concierge-v1';

export function getAiPolicy(env:NodeJS.ProcessEnv=process.env):AiPolicy {
  const provider=(env.AI_PROVIDER||DEFAULT_PROVIDER).trim();
  const model=(env.AI_MODEL||DEFAULT_MODEL).trim();
  const promptVersion=(env.AI_PROMPT_VERSION||DEFAULT_PROMPT).trim();
  const allowedModels=(env.AI_ALLOWED_MODELS||DEFAULT_MODEL).split(',').map(v=>v.trim()).filter(Boolean);
  if(!provider||!model||!promptVersion||!allowedModels.includes(model)) throw new Error('AI provider/model/prompt policy is invalid');
  return {provider,model,promptVersion,allowedModels};
}

export function getAiSystemPrompt(promptVersion:string):string {
  if(promptVersion!=='concierge-v1') throw new Error(`AI prompt version is not allowlisted: ${promptVersion}`);
  return 'You are the governed PNG Tourism Concierge. Answer only from supplied published tourism sources. Never infer or expose private, regulatory, internal, or unpublished information. If sources do not support an answer, say so.';
}
