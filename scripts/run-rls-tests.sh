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

project_id="$(sed -n 's/^project_id = "\(.*\)"$/\1/p' supabase/config.toml)"
if [[ -z "$project_id" ]]; then
  echo "Unable to read project_id from supabase/config.toml."
  exit 1
fi

database_container="supabase_db_${project_id}"
if ! docker inspect "$database_container" > /dev/null 2>&1; then
  echo "Supabase database container is not running: $database_container"
  exit 1
fi

while IFS= read -r test_file; do
  echo "Executing $test_file"
  docker exec -i "$database_container" \
    psql -U postgres -d postgres -X -v ON_ERROR_STOP=1 \
    < "$test_file"
done < "$test_manifest"

echo "All $test_count database test file(s) passed."
