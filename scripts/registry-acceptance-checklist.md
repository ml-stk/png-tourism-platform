# National Tourism Registry — Next Priority Acceptance Checklist

## Operator lifecycle

- Create operator record
- Validate required identity/contact fields
- Assign operator type/category
- Submit operator for review
- Approve operator
- Reject operator with reason
- Suspend operator
- Reinstate operator

## Governance

- Published records have an explicit status
- Only approved operators are exposed through public/partner APIs
- Registry changes retain audit metadata
- Duplicate operator identifiers are rejected
- Invalid state transitions are rejected

## Integration

- Public destination/experience data continues to work
- Partner API consumes governed registry data
- AI Concierge does not expose unapproved operators
- Demo workload can create representative registry records without corrupting production data

## Acceptance gate

All executable tests must pass in CI before Registry MVP acceptance is declared.
