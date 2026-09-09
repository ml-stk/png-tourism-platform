import type { ProvinceCode } from './types';

export type AiRiskClass = 'low' | 'medium' | 'high';
export type AiSourceKind = 'public_content' | 'public_destination' | 'public_operator';

export interface AiSourceRef {
  id: string;
  kind: AiSourceKind;
  title: string;
  provenance: string;
  publicationStatus: 'published';
}

export interface AiToolDefinition {
  name: string;
  description: string;
  risk: AiRiskClass;
  allowedSourceKinds: AiSourceKind[];
}

export interface AiToolRequest {
  toolName: string;
  input: Record<string, unknown>;
}

export interface AiToolResult {
  toolName: string;
  output: unknown;
  sources: AiSourceRef[];
}

export interface AiAnswer {
  answer: string;
  sources: AiSourceRef[];
  modelVersion: string;
  promptVersion: string;
  governed: true;
}

export interface AiConversationRequest {
  sessionId?: string;
  message: string;
  provinceCode?: ProvinceCode;
}

export interface AiConversationResponse extends AiAnswer {
  sessionId: string;
  refused?: boolean;
  refusalReason?: 'outside_tourism_scope' | 'private_or_regulatory_data' | 'unsafe_request' | 'unsupported';
}

export interface AiAuditEvent {
  sessionId: string;
  action: 'request' | 'tool_call' | 'response' | 'refusal';
  toolName?: string;
  modelVersion?: string;
  promptVersion: string;
  governed: true;
  metadata?: Record<string, unknown>;
}
