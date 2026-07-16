#!/usr/bin/env bash

set -euo pipefail

target="packages/core/src/database.types.ts"
generated_types="$(mktemp)"

cleanup() {
  rm -f "$generated_types"
}

trap cleanup EXIT

supabase gen types typescript --local > "$generated_types"
mv "$generated_types" "$target"

trap - EXIT
echo "Generated $target."
