#!/usr/bin/env bash

set -euo pipefail

test_manifest="$(mktemp)"

cleanup() {
  rm -f "$test_manifest"
}

trap cleanup EXIT

find supabase/tests -type f \
  \( -name '*.sql' -o -name '*.pg' \) \
  | LC_ALL=C sort \
  > "$test_manifest"

test_count="$(wc -l < "$test_manifest" | tr -d ' ')"

if [[ "$test_count" == "0" ]]; then
  echo "RLS test harness ready: 0 test files found."
  exit 0
fi

echo "Running $test_count database test file(s):"
while IFS= read -r test_file; do
  echo "- $test_file"
done < "$test_manifest"

# Supabase discovers and runs every *.sql and *.pg file in supabase/tests.
supabase test db --local
