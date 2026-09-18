# API Gateway Acceptance Matrix

This document defines the required CI acceptance cases for the NTDP API Gateway. Tests must exercise the deployed gateway/test harness and assert the status code and response headers described below.

| Case | Expected result |
|---|---|
| Missing credentials on protected route | HTTP 401 or 403 |
| Invalid API key | HTTP 401 or 403 |
| Valid API key with required scope | HTTP 2xx |
| Valid API key without required scope | HTTP 403 |
| Rate limit exceeded | HTTP 429 |
| Rate limit response | `Retry-After` header present and numeric |
| Error correlation | Request/correlation ID is preserved in the error response |
| Revoked API key | HTTP 401 or 403 |
| Public route without API key | HTTP 2xx |

## CI requirement

The implementation should expose these assertions as executable tests. No secrets or production API keys may be committed to the repository; CI should create isolated test credentials through the existing test fixture/configuration mechanism.
