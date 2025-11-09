#!/bin/bash

# Script to automatically update the test count badge in README.md
# This is run by GitHub Actions after tests complete

set -e

# Run tests and extract test count from JSON output
echo "Running tests to get count..."
TEST_OUTPUT=$(npm test -- --run --reporter=json 2>&1)
TEST_COUNT=$(echo "$TEST_OUTPUT" | grep -o '"numTotalTests":[0-9]*' | head -1 | grep -o '[0-9]*')

if [ -z "$TEST_COUNT" ]; then
  echo "❌ Error: Could not extract test count from test output"
  exit 1
fi

echo "✅ Found $TEST_COUNT tests"

# Update README.md badge
README_FILE="README.md"
CURRENT_BADGE=$(grep -o 'tests-[0-9]\+%20passing' "$README_FILE" || echo "tests-0%20passing")
CURRENT_COUNT=$(echo "$CURRENT_BADGE" | sed 's/tests-\([0-9]\+\)%20passing/\1/')

echo "Current badge shows: $CURRENT_COUNT tests"
echo "Actual test count: $TEST_COUNT tests"

if [ "$CURRENT_COUNT" != "$TEST_COUNT" ]; then
  echo "🔄 Updating badge from $CURRENT_COUNT to $TEST_COUNT..."
  sed -i "s/tests-[0-9]*%20passing/tests-${TEST_COUNT}%20passing/g" "$README_FILE"
  echo "✅ Badge updated successfully"
  exit 0
else
  echo "✅ Badge is already up to date"
  exit 0
fi
