#!/usr/bin/env bash
# usage: tools/look.sh  -> rebuild PDF and re-render page PNGs at 70dpi
cd "$(dirname "$0")/.."; node src/render.mjs && rm -f build/png/* && pdftoppm -r 70 -png output/German_A1_Complete_Coursebook.pdf build/png/p
