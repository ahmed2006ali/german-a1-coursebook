#!/usr/bin/env bash
# Full reproducible build: validate content -> render PDF -> DOCX -> QA report
set -euo pipefail
cd "$(dirname "$0")"
node tools/validate_content.mjs
node src/render.mjs
node src/docx.mjs
node tools/qa.mjs
