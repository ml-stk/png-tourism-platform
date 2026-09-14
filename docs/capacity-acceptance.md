# NTDP Capacity Acceptance

## Baseline

The Concept Note establishes an initial capacity baseline of up to 5,000 tourism operators and approximately 50 Authority staff users.

## API response pagination

High-growth enterprise list endpoints support bounded HTTP response pagination with `page` and `pageSize` query parameters. The default page size is 50 and the maximum is 100.

This control bounds response payload size. It does not by itself prove database/query-level scalability; production acceptance still requires measured load testing and query-level pagination or equivalent database-side limits where required.

## Acceptance evidence required

1. CI build and automated tests pass.
2. Pagination contract tests pass.
3. Representative load test at the 5,000-operator / 50-staff baseline is executed against the deployed environment.
4. Database latency, connection pool utilisation, error rate and API response latency are recorded.
5. No material regression is observed on public visitor APIs, registry workflows or enterprise workflows.
