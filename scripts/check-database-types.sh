#!/usr/bin/env bash

set -euo pipefail

committed_types="packages/core/src/database.types.ts"
generated_types="$(mktemp)"

cleanup() {
  rm -f "$generated_types"
}

trap cleanup EXIT

supabase gen types typescript --local \
  | perl -0pe 's/\n+\z/\n/' \
  > "$generated_types"

if ! diff -u "$committed_types" "$generated_types"; then
  echo
  echo "Generated database types are stale."
  echo "Run 'pnpm gen:types' with the local Supabase database running, then commit the result."
  exit 1
fi

echo "Generated database types match the local schema."
