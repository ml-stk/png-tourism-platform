import { randomUUID } from 'node:crypto';
import type { ContentRepository, DestinationRepository, OperatorRepository } from './contracts';
import type { AiAnswer, AiConversationRequest, AiConversationResponse, AiSourceRef, AiToolDefinition, AiToolRequest, AiToolResult } from '../domain/ai';

export interface AiConciergeDeps {
  destinations: DestinationRepository;
  content: ContentRepository;
  operators: OperatorRepository;
  generate?: (input: { message: string; toolResults: AiToolResult[]; promptVersion: string }) => Promise<AiAnswer>;
}

const PROMPT_VERSION = 'concierge-v1';
const MODEL_VERSION = 'governed-adapter-v1';

export const AI_TOOLS: readonly AiToolDefinition[] = [
  { name: 'search_destinations', description: 'Find published tourism destinations', risk: 'low', allowedSourceKinds: ['public_destination'] },
  { name: 'search_experiences', description: 'Find published tourism experiences', risk: 'low', allowedSourceKinds: ['public_content'] },
  { name: 'find_operator', description: 'Find published tourism operator profiles', risk: 'low', allowedSourceKinds: ['public_operator'] },
];

const refusal = (sessionId: string, reason: AiConversationResponse['refusalReason']): AiConversationResponse => ({ sessionId, answer: 'I can help with published Papua New Guinea tourism information, but I cannot provide private or regulatory information or assist with unsafe requests.', sources: [], modelVersion: MODEL_VERSION, promptVersion: PROMPT_VERSION, governed: true, refused: true, refusalReason: reason });

export class AiConciergeService {
  constructor(private readonly deps: AiConciergeDeps) {}

  listTools(): readonly AiToolDefinition[] { return AI_TOOLS; }

  async executeTool(request: AiToolRequest): Promise<AiToolResult> {
    const definition = AI_TOOLS.find((tool) => tool.name === request.toolName);
    if (!definition) throw new Error(`AI tool is not allowlisted: ${request.toolName}`);
    const query = typeof request.input.query === 'string' ? request.input.query.trim().toLowerCase() : '';
    if (!query) return { toolName: request.toolName, output: [], sources: [] };

    if (request.toolName === 'search_destinations') {
      const result = await this.deps.destinations.list({ limit: 1000 });
      const items = result.items.filter((item) => item.publicationStatus === 'published' && item.name.toLowerCase().includes(query));
      const sources = items.map((item) => ({ id: item.id, kind: 'public_destination' as const, title: item.name, provenance: `destination:${item.id}`, publicationStatus: 'published' as const }));
      return { toolName: request.toolName, output: items, sources };
    }
    if (request.toolName === 'search_experiences') {
      const result = await this.deps.content.list({ publicationStatus: 'published', limit: 1000 });
      const items = result.items.filter((item) => item.publicationStatus === 'published' && item.type === 'experience' && item.title.toLowerCase().includes(query));
      const sources = items.map((item) => ({ id: item.id, kind: 'public_content' as const, title: item.title, provenance: `content:${item.id}:v${item.version}`, publicationStatus: 'published' as const }));
      return { toolName: request.toolName, output: items, sources };
    }
    const result = await this.deps.operators.list({ limit: 1000 });
    const items = result.items.filter((item) => item.status === 'active' && item.legalName.toLowerCase().includes(query));
    const sources = items.map((item) => ({ id: item.id, kind: 'public_operator' as const, title: item.tradingName ?? item.legalName, provenance: `operator-public:${item.id}`, publicationStatus: 'published' as const }));
    return { toolName: request.toolName, output: items.map(({ id, legalName, tradingName, provinceCode }) => ({ id, legalName, tradingName, provinceCode })), sources };
  }

  async answer(request: AiConversationRequest): Promise<AiConversationResponse> {
    const sessionId = request.sessionId?.trim() || randomUUID();
    const message = request.message.trim();
    if (!message) return refusal(sessionId, 'unsupported');
    const lower = message.toLowerCase();
    if (/password|token|secret|license status|compliance|regulatory|suspended|private|internal/.test(lower)) return refusal(sessionId, 'private_or_regulatory_data');
    if (/weapon|violence|exploit|malware|self-harm/.test(lower)) return refusal(sessionId, 'unsafe_request');
    if (!/(png|papua|tour|travel|visit|destination|experience|hotel|operator|attraction|event)/.test(lower)) return refusal(sessionId, 'outside_tourism_scope');

    const toolRequests: AiToolRequest[] = [];
    if (/destination|where|visit|place|attraction/.test(lower)) toolRequests.push({ toolName: 'search_destinations', input: { query: request.provinceCode ? request.provinceCode.replace(/_/g, ' ') : message } });
    if (/experience|activity|do|adventure/.test(lower)) toolRequests.push({ toolName: 'search_experiences', input: { query: message } });
    if (/operator|tour company|tour operator/.test(lower)) toolRequests.push({ toolName: 'find_operator', input: { query: message } });
    const toolResults = await Promise.all(toolRequests.map((tool) => this.executeTool(tool)));
    const sources: AiSourceRef[] = toolResults.flatMap((result) => result.sources);
    if (this.deps.generate) {
      const generated = await this.deps.generate({ message, toolResults, promptVersion: PROMPT_VERSION });
      return { ...generated, sessionId, modelVersion: generated.modelVersion || MODEL_VERSION, promptVersion: PROMPT_VERSION, governed: true, sources: generated.sources.length ? generated.sources : sources };
    }
    const answer = sources.length ? `I found ${sources.length} published tourism source${sources.length === 1 ? '' : 's'} relevant to your request.` : 'I can help with published Papua New Guinea tourism information. Please provide a destination, experience, event, or operator you are interested in.';
    return { sessionId, answer, sources, modelVersion: MODEL_VERSION, promptVersion: PROMPT_VERSION, governed: true };
  }
}
