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
  --exclude='.gitkeep' \
  "$OBSIDIAN_DIR/" "$SOURCE_DIR/"

# git can't track empty directories. drop a .gitkeep in any that exist so they survive the commit.
find "$SOURCE_DIR" -type d -empty -exec touch {}/.gitkeep \;

echo "building notes"
node scripts/build-notes.js
