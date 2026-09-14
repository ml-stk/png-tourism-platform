#!/usr/bin/env bash
set -euo pipefail

if ! command -v supabase >/dev/null 2>&1; then
  echo "supabase CLI is required" >&2
  exit 1
fi

PROJECT_REF="${PROJECT_REF:-}"
OUTPUT_DIR="${OUTPUT_DIR:-backups}"

if [[ -z "$PROJECT_REF" ]]; then
  echo "Set PROJECT_REF to the Supabase project reference." >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUTPUT_FILE="$OUTPUT_DIR/ntdp-${TIMESTAMP}.sql"

supabase link --project-ref "$PROJECT_REF"
supabase db dump --linked --file "$OUTPUT_FILE"

echo "Logical backup created: $OUTPUT_FILE"
echo "Keep this file outside Git and protect it according to the project's data classification."
