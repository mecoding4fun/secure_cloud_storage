# Secure Cloud Storage (SCS) Backup Strategy

This project uses [Restic](https://restic.net/) for automated, encrypted, and deduplicated backups of the `SHARED_DIR`. 

Because backups run on the host filesystem—independent of the SCS API—they preserve all raw file metadata, do not consume container memory, and are immune to total destruction if the API itself were ever compromised.

## Prerequisites
You must have `restic` installed on the host machine running the Docker containers.
- Ubuntu/Debian: `sudo apt install restic`
- macOS: `brew install restic`

## Configuration
1. Create a `.backup.env` file in the root of the repository:
   ```env
   RESTIC_REPOSITORY=/path/to/backup/drive/or/s3/bucket
   RESTIC_PASSWORD=your-super-secure-encryption-password
   
   # You can also add AWS credentials if backing up to S3
   # AWS_ACCESS_KEY_ID=...
   # AWS_SECRET_ACCESS_KEY=...
   ```
   **Security Note:** `.backup.env` is entirely excluded from Docker and Git. Never commit this file.

2. Initialize your Restic repository (only required once):
   ```bash
   source .backup.env
   restic init
   ```

## Running Backups
To run a manual backup and prune old snapshots, execute the provided script:
```bash
chmod +x scripts/backup.sh
./scripts/backup.sh
```
This script automatically backs up `./server/shared` and enforces a retention policy (keeping the last 7 days, 4 weeks, and 6 months of backups).

## Scheduled Backups
You can automate backups using standard host cron jobs.
Open your crontab (`crontab -e`) and add a daily backup schedule at 2:00 AM:
```cron
0 2 * * * cd /path/to/secure_cloud_storage && ./scripts/backup.sh >> /var/log/scs_backup.log 2>&1
```

## Verifying Restorability
We have included a verification script to guarantee your backups are healthy and actually restorable:
```bash
chmod +x scripts/verify_backup.sh
./scripts/verify_backup.sh
```
This script runs a strict integrity check on the remote repository (`restic check`) and performs a complete dummy restore into a temporary folder to prove the encryption password is correct and files are intact.

## Manual Restoration
If you ever need to manually restore the entire storage directory due to catastrophic failure:
1. Load credentials: `source .backup.env`
2. List snapshots: `restic snapshots`
3. Restore the latest snapshot to the shared directory:
   ```bash
   restic restore latest --target /
   ```
*(Note: Because Restic stores absolute paths depending on where you backed them up from, using `--target /` effectively overlays the restored files precisely back into their original `./server/shared` absolute location.)*
