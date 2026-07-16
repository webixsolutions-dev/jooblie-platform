#!/usr/bin/env bash

set -euo pipefail

test_count="$(
  find supabase/tests -type f \
    \( -name '*.sql' -o -name '*.pg' \) \
    | wc -l \
    | tr -d ' '
)"

if [[ "$test_count" == "0" ]]; then
  echo "RLS test harness ready: 0 test files found."
  exit 0
fi

echo "Running $test_count database test file(s)."
supabase test db --local
