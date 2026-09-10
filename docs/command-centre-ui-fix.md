# Command Centre UI build fix

The Command Centre metric-card definitions are explicitly typed as `MetricCard[]` so Lucide icons are not widened into a mixed tuple union during TypeScript compilation.
