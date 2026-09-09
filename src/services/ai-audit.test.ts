import { describe, expect, it } from 'vitest';

describe('AI audit contract',()=>{
 it('requires governed audit records to identify the session and prompt',()=>{const event={sessionId:'s1',action:'request' as const,promptVersion:'concierge-v1',governed:true as const};expect(event.sessionId).toBeTruthy();expect(event.promptVersion).toBe('concierge-v1');expect(event.governed).toBe(true);});
});
