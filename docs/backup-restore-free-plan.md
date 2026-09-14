# NTDP Backup and Restore Procedure — Free Supabase Plan

## Purpose

This procedure provides a reproducible logical backup and restore path for the National Tourism Digital Platform (NTDP) while the production Supabase project remains on the Free plan.

Supabase-managed downloadable database backups and Restore to a New Project are not assumed to be available on the Free plan. The authoritative project schema remains version-controlled under `db/migrations/`.

## Scope

This procedure covers the PostgreSQL database. Supabase Storage objects, Edge Functions, Auth configuration, API keys, Realtime configuration, and other platform configuration require separate backup/recovery procedures.

## Backup

Run from a trusted workstation with the Supabase CLI authenticated and linked to the NTDP project:

```bash
supabase link --project-ref <PROJECT_REF>
supabase db dump --linked --file backups/ntdp-$(date -u +%Y%m%dT%H%M%SZ).sql
```

Store the resulting SQL dump in an approved, access-controlled off-site location. Do not commit production database dumps, credentials, tokens, service-role keys, or connection strings to Git.

For a schema-only recovery artifact, use:

```bash
supabase db dump --linked --schema-only --file backups/ntdp-schema-$(date -u +%Y%m%dT%H%M%SZ).sql
```

## Restore drill

Never restore directly over the production project as an acceptance test.

Use an isolated PostgreSQL database or an approved staging Supabase project. Restore the logical dump using PostgreSQL tooling appropriate to the target environment, for example:

```bash
createdb ntdp_restore_test
psql ntdp_restore_test < backups/<BACKUP_FILE>.sql
```

The exact restore command must be adapted to the target PostgreSQL environment and must not expose credentials in shell history or logs.

## Post-restore validation

Run the following checks against the restored database:

1. Confirm all NTDP migrations through the current repository migration are represented.
2. Confirm the expected NTDP schemas and tables exist: `analytics`, `commerce`, `distribution`, `gateway`, `gis`, and the public NTDP tables.
3. Confirm primary keys, foreign keys, unique constraints and critical indexes.
4. Confirm PostGIS and required extensions.
5. Confirm RLS is enabled on protected NTDP tables and expected policies exist.
6. Confirm seeded reference data, including five distribution channels, payment-provider readiness data, metric definitions and gateway routes.
7. Execute the NTDP lifecycle smoke functions where permitted by the target environment.
8. Compare critical row counts and integrity checks against a production baseline captured immediately before the backup.
9. Run the application test suite, build, server build and API smoke tests.
10. Record restore timestamp, backup identifier, target environment, validation results, discrepancies and remediation actions.

## Production baseline

Before each formal backup/restore drill, capture a read-only baseline such as:

```sql
select current_database() as database_name,
       current_timestamp as checked_at,
       pg_size_pretty(pg_database_size(current_database())) as database_size;
```

Also capture row counts for critical NTDP tables and the applied migration list. Do not include secrets or sensitive personal data in the acceptance report.

## Acceptance status

For a Free-plan production project, a successful logical dump is evidence that a backup artifact can be produced. It is **not** evidence of a successful restore until the dump has actually been restored into an isolated target and the post-restore validation has passed.

Until that drill is completed, the release gate should remain **PARTIALLY VALIDATED / EXTERNAL CONTROL REQUIRED**.

## Operational requirements

- Protect backup files with encryption at rest and access controls appropriate to their data classification.
- Retain backups according to PNGTPA-approved retention requirements.
- Test restores periodically rather than relying solely on successful backup creation.
- Keep database migrations in Git as the authoritative schema-change history.
- Maintain a separate recovery procedure for Storage objects and platform configuration.
