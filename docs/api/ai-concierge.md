# AI Concierge API

## Purpose

The AI Concierge is exposed as a governed platform service. It may use only explicitly allowlisted tools backed by published tourism data. It must not access regulatory, private, or internal records directly.

## Endpoint

`POST /api/v1/ai/concierge`

The current foundation endpoint is authenticated. A later visitor-channel hardening phase may expose a public route with rate limiting and abuse controls.

### Request

```json
{
  "sessionId": "optional-session-id",
  "message": "What experiences can I find in Papua New Guinea?",
  "provinceCode": "NCD"
}
```

Validation requirements:
- `message` is required and must be a string.
- `message` is limited to 4,000 characters at the HTTP boundary.
- `provinceCode`, when supplied, is treated as a platform province code and must not be used to bypass service-layer governance.

### Response

```json
{
  "data": {
    "sessionId": "...",
    "answer": "...",
    "sources": [],
    "modelVersion": "governed-adapter-v1",
    "promptVersion": "concierge-v1",
    "governed": true
  },
  "requestId": "..."
}
```

Refusals remain successful service responses with `refused: true` and an explicit `refusalReason`. They must not disclose restricted data.

## Allowlisted tools

| Tool | Source boundary | Risk |
| --- | --- | --- |
| `search_destinations` | Published destinations | Low |
| `search_experiences` | Published tourism content | Low |
| `find_operator` | Active public operator profiles | Low |

The service rejects unknown tools. Tool results include source provenance so a model adapter can ground its answer in governed records.

## Model adapter boundary

The model adapter is optional in the foundation. When configured, it receives the user message and governed tool results; it does not receive repository handles or direct database access. Provider-specific integration belongs behind this adapter boundary.

## Governance requirements

Production integration must add or retain:
- provider/model allowlisting and a versioned prompt registry;
- persisted AI audit events for requests, tool calls, responses, and refusals;
- rate limiting and abuse controls for visitor access;
- provenance integrity and source-resolution controls;
- adversarial/safety tests and observability;
- explicit separation between public tourism content and regulatory/private data.
