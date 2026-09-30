# PNG Tourism Platform connection

Verified target: PNG Tourism Platform, Sydney (`ap-southeast-2`).
Project reference: `yxhatvvgietyvjhlqoqg`.
API URL: https://yxhatvvgietyvjhlqoqg.supabase.co

The Codex Supabase connector is authenticated and verified against this project.
The local CLI link was completed and verified on 2026-09-29 after interactive login.
The link command exited successfully and `.temp/project-ref` matches the target above.
Connector authorization is separate from CLI credentials.

For a new checkout, use the repository terminal:

```powershell
npx.cmd --yes supabase@2.118.0 login
npx.cmd --yes supabase@2.118.0 link --project-ref yxhatvvgietyvjhlqoqg
```

Complete the browser login privately. Do not place tokens, database passwords or service
keys in Git or chat. The CLI link must succeed before treating the checkout as linked.
Generated `.temp` and `.branches` directories are ignored.

This is LOCAL development configuration, not an authoritative production configuration.
Do not run `config push`, `db push`, `db reset --linked`, migration repair, or the custom
`db:migrate` runner against production. Linking does not reconcile database history.
CLI migration and seed execution are disabled in this configuration while reconciliation
is outstanding. Historical migrations remain under `db/migrations`; they have not been
copied into a competing Supabase migration history.

Live database: PostgreSQL 17.6; PostGIS 3.3.7 in `extensions` (verified 2026-09-29).
The generated local configuration uses PostgreSQL major version 17. No database password
or runtime DATABASE_URL has been created. Local runtime database access requires its own
secure connection setup; CLI linking and connector access do not supply that automatically.
