# National Tourism Registry Operator Lifecycle — Executable-Test Specification

The application/API test harness must implement these assertions against the governed `operators` lifecycle:

1. Create operator in `draft`.
2. Submit `draft -> pending_review`; `submitted_at` is populated.
3. Approve `pending_review -> active`; `reviewed_at` is populated.
4. Reject `pending_review -> rejected`; rejection reason is required.
5. Return `rejected -> draft` for correction/resubmission.
6. Suspend `active -> suspended`; `suspended_at` is populated.
7. Reinstate `suspended -> active`.
8. Close an eligible operator; `closed_at` is populated.
9. Reject invalid transitions such as `draft -> active`.
10. Reject duplicate registration numbers.
11. Public/partner-facing queries exclude non-active operators.
12. AI Concierge queries exclude non-active operators.
13. Lifecycle mutations retain audit metadata.

No production/demo operator records may be mutated by acceptance tests. Use isolated fixtures and rollback/cleanup.
