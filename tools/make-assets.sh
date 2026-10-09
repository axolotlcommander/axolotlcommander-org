#!/bin/bash
# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright (C) 2026 The Axolotl Commander Authors
#
# Regenerates the images in static/ from assets-src/ (macOS: sips, swift; Homebrew: webp, libavif).
# The results are committed, so the site build itself needs nothing but Node.
#
# assets-src/icon-1024.png and avatar-1024.png come from the app repository:
#   swift scripts/make-icon.swift icon-1024.png
#   swift scripts/make-icon.swift avatar-1024.png avatar
# assets-src/screenshot.png is docs/images/screenshot.png of the app repository.
set -euo pipefail
cd "$(dirname "$0")/.."

for tool in sips swift cwebp avifenc; do
  command -v "$tool" >/dev/null || { echo "missing: $tool (brew install webp libavif)" >&2; exit 1; }
done

SRC=assets-src
OUT=static/assets
mkdir -p "$OUT"

resize() { sips -Z "$1" "$2" --out "$3" >/dev/null; }

# Icons: page (64, 256), web app manifest (192, 512), favicon.ico (16, 32, 48).
for size in 64 192 256 512; do
  resize "$size" "$SRC/icon-1024.png" "$OUT/icon-$size.png"
done
swift tools/images.swift ico "$SRC/icon-1024.png" static/favicon.ico
# iOS rounds the corners itself and fills transparency with black, so it gets the full-bleed tile.
resize 180 "$SRC/avatar-1024.png" static/apple-touch-icon.png

# Screenshot: 1240 px (1x) and 2480 px (2x) in AVIF, WebP and PNG for old browsers.
for width in 1240 2480; do
  resize "$width" "$SRC/screenshot.png" "$OUT/screenshot-$width.png"
  cwebp -quiet -q 84 -m 6 "$OUT/screenshot-$width.png" -o "$OUT/screenshot-$width.webp"
  avifenc --jobs all -q 70 -s 4 "$OUT/screenshot-$width.png" "$OUT/screenshot-$width.avif" >/dev/null
done

# Social previews, one per language.
for lang in en cs; do
  swift tools/images.swift og "$lang" "$SRC/icon-1024.png" "$SRC/screenshot.png" "$OUT/og-$lang.png"
done

ls -l static/favicon.ico static/apple-touch-icon.png "$OUT" | awk 'NR > 1 { print $5, $NF }'
