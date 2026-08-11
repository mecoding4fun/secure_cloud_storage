#!/usr/bin/env bash
set -e

# Load credentials
if [ -f ".backup.env" ]; then
    set -a
    source .backup.env
    set +a
else
    echo "Error: .backup.env file not found."
    echo "Please create it with RESTIC_REPOSITORY and RESTIC_PASSWORD."
    exit 1
fi

if [ -z "$RESTIC_REPOSITORY" ] || [ -z "$RESTIC_PASSWORD" ]; then
    echo "Error: RESTIC_REPOSITORY and RESTIC_PASSWORD must be set in .backup.env"
    exit 1
fi

# Determine the directory to backup
BACKUP_SOURCE="./server/shared"

if [ ! -d "$BACKUP_SOURCE" ]; then
    echo "Error: Backup source directory $BACKUP_SOURCE does not exist."
    exit 1
fi

echo "Starting backup of $BACKUP_SOURCE to $RESTIC_REPOSITORY..."

# Run restic backup
restic backup "$BACKUP_SOURCE" --verbose

# Automatically prune old backups (e.g., keep last 7 days, 4 weeks, 6 months)
echo "Pruning old backups..."
restic forget --keep-daily 7 --keep-weekly 4 --keep-monthly 6 --prune

echo "Backup completed successfully."
