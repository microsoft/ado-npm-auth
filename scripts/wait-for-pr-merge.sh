#!/usr/bin/env bash

# Waits for PR_NUMBER to merge or be closed, then deletes PR_BRANCH.
# A closed, unmerged PR fails the script.

set -euo pipefail

log_warning() {
  echo "##vso[task.logissue type=warning]$1"
}

log_fail() {
  echo "##vso[task.logissue type=error]$1"
  exit 1
}

# Inputs
[[ -z "${PR_BRANCH:-}" ]] && log_fail "PR_BRANCH is required."
[[ -z "${PR_NUMBER:-}" ]] && log_fail "PR_NUMBER is required."
[[ -z "${BUILD_REPOSITORY_URI:-}" ]] && log_fail "BUILD_REPOSITORY_URI is required."
pr_url="${BUILD_REPOSITORY_URI%/}/pull/$PR_NUMBER"

get_pr_state() {
  local attempt
  local max_retries=3
  local delay=5

  for ((attempt = 0; attempt <= max_retries; attempt++)); do
    if state=$(gh pr view "$PR_NUMBER" --json state --jq '.state'); then
      return 0
    fi

    if ((attempt == max_retries)); then
      log_fail "Failed to get state for PR #$PR_NUMBER after $max_retries retries."
    fi

    log_warning "Failed to get state for PR #$PR_NUMBER; retrying in ${delay}s ($((attempt + 1))/$max_retries)."
    sleep "$delay"
    delay=$((delay * 2))
  done
}

delete_release_branch() {
  echo "Attempting to delete release branch $PR_BRANCH"

  if git ls-remote --exit-code --heads origin "refs/heads/$PR_BRANCH" >/dev/null 2>&1; then
    if git push origin --delete "$PR_BRANCH"; then
      echo "Deleted release branch $PR_BRANCH."
    else
      log_warning "Failed to delete release branch $PR_BRANCH."
    fi
  else
    local ls_remote_status=$?
    if [[ $ls_remote_status -eq 2 ]]; then
      echo "Release branch $PR_BRANCH was already deleted."
    else
      log_warning "Failed to check release branch $PR_BRANCH."
    fi
  fi
}

echo "Waiting for PR #$PR_NUMBER to merge at $pr_url ..."

while true; do
  get_pr_state
  case "$state" in
    MERGED)
      echo "PR #$PR_NUMBER merged. Cleaning up branch..."
      delete_release_branch
      break
      ;;
    CLOSED)
      echo "PR #$PR_NUMBER closed without merge. Cleaning up branch..."
      delete_release_branch
      log_fail "PR $pr_url was closed without merge."
      break
      ;;
    OPEN)
      echo "[$(date +"%H:%M:%S")] PR #$PR_NUMBER still open. Please merge: $pr_url ; sleeping 2 minutes."
      sleep 120
      ;;
    *)
      log_fail "Unexpected state '$state' for PR #$PR_NUMBER."
      ;;
  esac
done
