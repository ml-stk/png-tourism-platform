# NTDP Capacity Acceptance

The initial capacity baseline is 5,000 tourism operators and approximately 50 Authority staff users.

High-growth enterprise list endpoints use bounded HTTP response pagination: default 50 records per page, maximum 100, with `page` and `pageSize` parameters and pagination metadata.

This response-level control limits payload size. It is not a substitute for database/query-level pagination. Final production acceptance requires representative load testing at the 5,000-operator / 50-staff baseline and evidence covering API latency, database latency, connection-pool utilisation and error rate.
