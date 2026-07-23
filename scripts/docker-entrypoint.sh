#!/bin/sh
set -eu

mkdir -p "$VIDORA_DATA_DIR"

# Seed only missing directories so user data survives image upgrades.
for directory in assets modelPrompt models skills vendor; do
  if [ ! -e "$VIDORA_DATA_DIR/$directory" ] && [ -e "/app/default-data/$directory" ]; then
    cp -a "/app/default-data/$directory" "$VIDORA_DATA_DIR/$directory"
  fi
done

exec "$@"
