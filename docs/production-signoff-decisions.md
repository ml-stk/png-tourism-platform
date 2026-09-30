# PNG TPA production sign-off decisions

Status: candidate defaults for PNG TPA review. These defaults are conservative and can
be refined before production promotion. Approval changes policy; it does not require
discarding the additive database compatibility work.

## Canonical tourism-asset contract

The candidate contract is a forward-compatible superset:

- `registry_id` remains the stable external registry identifier.
- `id` remains the internal UUID primary key.
- `slug` is the stable human-readable web identifier.
- `publication_status` is canonical: `draft`, `review`, `published`, `archived`.
- Legacy `status` remains synchronized as `draft`, `submitted`, `published`, `suspended`.
- `province_id` and `province_code` remain synchronized for integration compatibility.
- Publishing an operator-owned asset requires an active operator.
- `anon` and `authenticated` retain no direct table privileges. Application access goes
  through the authenticated server until TPA approves a narrower Data API model.

Migration `0038_reconcile_tourism_asset_contract.sql` is additive and supports both the
deployed and fresh starting shapes. It does not drop production identifiers or columns.
Automated tests cover both shapes, legacy and canonical writes, lifecycle synchronization,
operator validation and deny-by-default client access.

PNG TPA decisions still requested:

1. Confirm `registry_id` is the identifier shown on licences, certificates and integrations.
2. Confirm whether archived assets may return to review or require a new version.
3. Confirm whether attractions may be published without an operator.
4. Confirm whether provinces are mandatory for every asset.
5. Confirm whether any public Data API access is required, or all access remains server-mediated.

## Proposed role matrix

| Role | Scope | Allowed | Explicitly excluded |
| --- | --- | --- | --- |
| Platform administrator | National | Users, roles, configuration, all operational modules | Routine use as an operator account |
| TPA regulator | National | Operator approval, compliance, licensing, memberships, registry publication | Platform security configuration |
| Provincial administrator | Assigned provinces | Read operators/assets; manage province content and review submissions | National reporting snapshot, settlements, gateway administration |
| Content manager | Assigned provinces or national assignment | Draft/review content and media; publish only with `content:publish` | Operator approval, compliance, payments |
| Tourism operator | Assigned operator IDs | Own profile, assets, memberships and permitted commerce requests | Other operators, approval, settlement |
| Analyst | National read-only | Approved reporting and intelligence views | Row mutation, identity administration, private operational notes |

Assignments require least privilege, named users, province/operator scope where applicable,
quarterly review and immediate removal on role change. TPA must nominate business owners
for regulator, provincial and analyst access.

## GitHub protection baseline

Apply to `main` before merge:

- Require pull requests and at least one approving reviewer.
- Dismiss stale approvals when new commits are pushed.
- Require conversation resolution.
- Require the `Candidate Release and Recovery` status check.
- Require the branch to be current before merge.
- Block force pushes and branch deletion.
- Restrict direct pushes and production deployment approval to nominated maintainers.
- Keep Actions workflow permissions read-only except where an explicitly reviewed job
  needs more access.

Record a screenshot or exported ruleset as sign-off evidence. The current browser session
was not authenticated to repository settings, so these controls are not yet verified.

## Authentication baseline

- Enable leaked-password protection if supported by the selected Supabase plan.
- Require at least eight characters immediately; TPA should approve a stronger minimum
  and MFA requirements for administrators and regulators.
- Keep refresh-token rotation enabled and JWT lifetime at one hour or less.
- Do not authorize from user-editable metadata.
- Use separate non-production accounts for operator, disabled-user, regulator and
  provincial-scope acceptance tests.

Run `npm run test:supabase:staging` only against an isolated staging environment. Supply
its required values through process environment variables or an approved secret manager;
never commit them. The check performs login, own/cross-operator access, refresh rotation,
disabled-user rejection, global logout and post-logout refresh rejection without printing
credentials or tokens.

## Recovery targets proposed for approval

| Service tier | Scope | Proposed RPO | Proposed RTO |
| --- | --- | ---: | ---: |
| Tier 1 | Auth configuration, operator registry, roles, compliance and transactional records | 4 hours | 8 hours |
| Tier 2 | Published content, media metadata, distribution and gateway configuration | 24 hours | 24 hours |
| Tier 3 | Rebuildable analytics and derived reporting | 24 hours | 48 hours |

Required controls:

- Encrypted offsite backups in an approved region and account.
- Daily retention for 35 days, monthly retention for 12 months and annual retention for
  seven years, subject to TPA records and privacy policy.
- Quarterly application-database restore tests and annual full Supabase project exercises.
- Separate capture of PostgreSQL data, Auth identities/configuration, Storage metadata and
  object bytes, secrets, provider configuration, Edge Functions and deployment settings.
- Restore into an isolated project, validate access and business workflows, then use an
  explicitly approved cutover. Never restore over the live project as the first recovery step.
- Named incident commander, technical recovery lead, business validator and communications owner.

PNG TPA must approve the targets, retention periods, data residency, recovery owners and
acceptable service degradation. Until then these are engineering defaults, not contractual
commitments.

## Remaining acceptance evidence

1. Staging project reference and designated test identities.
2. Successful real-session test output for each approved role/scope.
3. Sanitized production-topology backup restored into an isolated project.
4. Auth, Storage, secrets and deployment recovery evidence.
5. Approved role matrix and tourism-asset decisions.
6. Verified GitHub and hosting deployment protections.
7. Approved RPO, RTO, retention and recovery ownership.

