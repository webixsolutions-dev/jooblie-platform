#!/usr/bin/env bash

set -euo pipefail

base_ref="${1:?base git ref is required}"
head_ref="${2:-HEAD}"

if git diff --name-only "$base_ref" "$head_ref" | grep -Eq \
  '^(\.github/workflows/ci\.yml|package\.json|pnpm-lock\.yaml|packages/core/src/database\.types\.ts|scripts/check-database-types\.sh|scripts/run-rls-tests\.sh|scripts/ci/database-changes\.sh|supabase/)'; then
  echo "true"
else
  echo "false"
fi
