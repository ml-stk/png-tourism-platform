# AI Concierge API

## Planned endpoint

`POST /api/v1/ai/concierge`

Request:

```json
{
  "sessionId": "optional-session-id",
  "message": "What experiences can I find in Papua New Guinea?",
  "provinceCode": "NCD"
}
```

Response:

```json
{
  "data": {
    "sessionId": "...",
    "answer": "...",
    "sources": [],
    "modelVersion": "...",
    "promptVersion": "concierge-v1",
    "governed": true
  },
  "requestId": "..."
}
```

Refusals remain successful service responses with `refused: true` and an explicit `refusalReason`; they must not disclose restricted data.

The endpoint must enforce rate limiting and request-size limits before model execution. It must call the AI concierge service rather than repositories directly.
