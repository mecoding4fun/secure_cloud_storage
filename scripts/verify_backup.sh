#!/usr/bin/env bash
set -e

# Load credentials
if [ -f ".backup.env" ]; then
    set -a
    source .backup.env
    set +a
else
    echo "Error: .backup.env file not found."
    exit 1
fi

if [ -z "$RESTIC_REPOSITORY" ] || [ -z "$RESTIC_PASSWORD" ]; then
    echo "Error: RESTIC_REPOSITORY and RESTIC_PASSWORD must be set in .backup.env"
    exit 1
fi

echo "Verifying backup repository integrity..."
restic check

echo "Testing restore functionality..."
RESTORE_DIR=$(mktemp -d)

# Restore the latest snapshot to the temporary directory
restic restore latest --target "$RESTORE_DIR"

echo "Latest snapshot successfully restored to $RESTORE_DIR."
echo "Cleaning up test restore..."
rm -rf "$RESTORE_DIR"

echo "Backup verification fully passed! Repository is healthy and restorable."
