#!/usr/bin/env bash
# Create github.com/ahmed2006ali/german-a1-coursebook and push main.
set -euo pipefail
export PATH="${HOME}/.local/bin:${PATH}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! gh auth status -h github.com &>/dev/null; then
  echo "GitHub CLI is not signed in. Run once:"
  echo "  gh auth login -h github.com -p https -w"
  exit 1
fi

if git remote get-url origin &>/dev/null; then
  echo "Remote origin already set: $(git remote get-url origin)"
  git push -u origin main
else
  gh repo create ahmed2006ali/german-a1-coursebook \
    --public \
    --source=. \
    --remote=origin \
    --push \
    --description "Deutsch A1 coursebook (PDF/DOCX) from Learn German YouTube A1 playlist"
fi

echo "Done: https://github.com/ahmed2006ali/german-a1-coursebook"
