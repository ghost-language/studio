#!/usr/bin/env bash
#
# Render the verification scene and hold it against the measured references.
#
#   tools/verify.sh
#
# Exits non-zero if any tile is less than a perfect match, so it can gate a
# build. "Looks right" is not a check; this is the thing that turns a claim
# about a pixel into a fact about one.
#
# LUMEN overrides the interpreter. A display is not needed - the run goes
# through Xvfb when one is not already attached.
set -uo pipefail

cd "$(dirname "$0")/.." || exit 1

LUMEN="${LUMEN:-lumen}"

if ! command -v "$LUMEN" >/dev/null 2>&1; then
  echo "verify: no lumen on PATH; set LUMEN=/path/to/lumen" >&2
  exit 1
fi

runner=()

if [ -z "${DISPLAY:-}" ]; then
  if ! command -v xvfb-run >/dev/null 2>&1; then
    echo "verify: no DISPLAY and no xvfb-run; cannot render headlessly" >&2
    exit 1
  fi

  runner=(xvfb-run -a)
fi

shot=$("${runner[@]}" "$LUMEN" verify.gs 2>/dev/null | sed -n 's/^SHOT://p')

if [ -z "$shot" ] || [ ! -f "$shot" ]; then
  echo "verify: the scene did not produce a screenshot" >&2
  exit 1
fi

echo "rendered $shot"
exec python3 tools/compare-tiles.py "$shot"
