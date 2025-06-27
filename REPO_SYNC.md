# Repository Synchronization Guide

This monorepo uses Git Subtree to sync with separate repositories for the web and AI components.

## Quick Start

```bash
# Bidirectional sync (recommended)
./repo-sync.sh both

# Push your changes only
./repo-sync.sh push

# Pull external changes only  
./repo-sync.sh pull
```

## Repository Structure

- **Monorepo**: `maratron-monorepo` (main development)
- **Web Repo**: `maratron-web` (synced from `apps/web/`)
- **AI Repo**: `maratron-ai` (synced from `apps/ai/`)

## Available Scripts

### `./repo-sync.sh` (Recommended)
Comprehensive sync script with multiple modes:
- `both` - Pull external changes, then push local changes
- `push` - Push local changes to separate repos
- `pull` - Pull changes from separate repos

## Automatic Sync Options

### Option 1: Git Alias (Recommended) ✅
```bash
# Use this instead of regular git push
git sync-push

# Works with arguments too
git sync-push origin main
git sync-push --force
```

### Option 2: Direct Script
```bash
# Use the script directly
./git-sync-push

# With arguments  
./git-sync-push origin main
```

### Option 3: Legacy Wrapper
```bash
# Alternative wrapper script
./git-push
```

### Option 3: Manual Sync Scripts
```bash
# Traditional manual workflow
git push
./repo-sync.sh push
```

## Common Workflows

### Daily Development (with auto-sync)
```bash
# Start of day - get latest changes
./repo-sync.sh pull

# Make your changes...
git add .
git commit -m "Your changes"

# Push with automatic sync
git sync-push
```

### Daily Development (manual)
```bash
# Start of day - get latest changes
./repo-sync.sh pull

# Make your changes...
git add .
git commit -m "Your changes"

# End of day - sync everything
./repo-sync.sh push
```

### Full Sync
```bash
# Get all changes and push all changes
./repo-sync.sh both
```

### Emergency Pull
If someone made changes directly to a sub-repo:
```bash
./repo-sync.sh pull
```

## Manual Commands

If you need more control:

```bash
# Pull from specific repo
git subtree pull --prefix=apps/web web-origin main --squash
git subtree pull --prefix=apps/ai ai-origin main --squash

# Push to specific repo
git subtree push --prefix=apps/web web-origin main
git subtree push --prefix=apps/ai ai-origin main
```

## Important Notes

⚠️ **Always work in the monorepo** - don't make direct changes to the separate repositories unless absolutely necessary.

⚠️ **Commit before syncing** - the scripts will prompt you to commit any uncommitted changes.

⚠️ **Use `both` mode when in doubt** - it's the safest way to stay in sync.

## Troubleshooting

### Merge Conflicts
If you get merge conflicts during pull:
1. Resolve conflicts manually
2. Commit the resolution
3. Run `./repo-sync.sh push` to sync

### Force Push Required
The scripts automatically handle this for initial setup and when histories diverge.

### No Changes to Pull
This is normal - it just means the separate repos haven't changed.