#!/usr/bin/env bash

# Finds or creates the release PR for BRANCH using GH_TOKEN.
# Requires BUILD_NUMBER and sets the read-only Azure Pipelines variable named by VARIABLE_NAME.

set -euo pipefail

if [[ -z "${VARIABLE_NAME:-}" ]]; then
  echo "##vso[task.logissue type=error]VARIABLE_NAME is required."
  exit 1
fi

pr_title="📦 applying package updates ***NO_CI***"
pr_body="Applying package updates for release build ${BUILD_NUMBER}"
pr_number=$(gh pr list --head "$BRANCH" --state all --json number --jq '.[0].number')

if [[ -z "$pr_number" ]]; then
  gh pr create --head "$BRANCH" --base main --title "$pr_title" --body "$pr_body"
  echo "Created PR for $BRANCH"
  pr_number=$(gh pr list --head "$BRANCH" --json number --jq '.[0].number')
else
  echo "PR #$pr_number already exists for $BRANCH"
fi

if [[ -n "$pr_number" ]]; then
  echo "##vso[task.setvariable variable=$VARIABLE_NAME;isReadOnly=true]$pr_number"
  echo "Recorded PR number $pr_number"
fi