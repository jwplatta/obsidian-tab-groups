#!/bin/bash

set -e

VAULT="${1:-$HOME/Documents/development_vault}"
PLUGIN_ID="tab-groups"
DEST="$VAULT/.obsidian/plugins/$PLUGIN_ID"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR/.."

echo "Building plugin..."
cd "$ROOT"
npm run build

echo "Installing to $DEST..."
mkdir -p "$DEST"
cp "$ROOT/main.js" "$DEST/"
cp "$ROOT/manifest.json" "$DEST/"
cp "$ROOT/styles.css" "$DEST/"

echo "Done. Enable 'Tab Groups' in Obsidian → Settings → Community plugins."
