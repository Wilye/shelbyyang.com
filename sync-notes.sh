#!/usr/bin/env bash
set -euo pipefail

OBSIDIAN_DIR="/Users/shelbyyang/Obsidian/Shelby/Knowledge Base"
SOURCE_DIR="./notes-src"

if [ ! -d "$OBSIDIAN_DIR" ]; then
  echo "obsidian vault not found at: $OBSIDIAN_DIR" >&2
  exit 1
fi

mkdir -p "$SOURCE_DIR"

echo "syncing obsidian -> $SOURCE_DIR"
rsync -av --delete \
  --exclude='.obsidian' \
  --exclude='.DS_Store' \
  --exclude='.trash' \
  "$OBSIDIAN_DIR/" "$SOURCE_DIR/"

echo "building notes"
node scripts/build-notes.js
