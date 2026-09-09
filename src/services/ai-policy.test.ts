import { describe, expect, it } from 'vitest';
import { getAiPolicy, getAiSystemPrompt } from './ai-policy';

describe('AI policy',()=>{
 it('requires the selected model to be allowlisted',()=>{expect(()=>getAiPolicy({AI_PROVIDER:'test',AI_MODEL:'blocked',AI_ALLOWED_MODELS:'allowed',AI_PROMPT_VERSION:'concierge-v1'})).toThrow();});
 it('accepts an allowlisted model',()=>{expect(getAiPolicy({AI_PROVIDER:'test',AI_MODEL:'allowed',AI_ALLOWED_MODELS:'allowed,other',AI_PROMPT_VERSION:'concierge-v1'}).model).toBe('allowed');});
 it('rejects unknown prompt versions',()=>{expect(()=>getAiSystemPrompt('unknown')).toThrow();});
 it('returns a boundary-enforcing system prompt',()=>{expect(getAiSystemPrompt('concierge-v1')).toContain('published tourism sources');});
});
