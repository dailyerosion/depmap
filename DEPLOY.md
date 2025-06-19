# Project deployment to production

This document describes the steps involved with deployment of this app to
production.

## Steps

1. Ensure zero bugs exist :)
2. Bump the version in some appropriate fashion:
   - `npm run release:patch` - Bug fixes (1.0.0 → 1.0.1)
   - `npm run release:minor` - New features (1.0.0 → 1.1.0)  
   - `npm run release:major` - Breaking changes (1.0.0 → 2.0.0)
3. Deploy:
   `npm run deploy`
4. Profit.

## Why the Two-Step Approach?

The manual version determination step is essential because:

- Semantic meaning: You decide if changes are patches, features, or breaking
- Release planning: Conscious decision about version impact
- Change documentation: Time to review what's being released
- Git history: Clean separation between version bump and deployment

## Quick Reference

```bash
# For bug fixes
npm run release:patch && npm run deploy

# For new features  
npm run release:minor && npm run deploy

# For breaking changes
npm run release:major && npm run deploy
```

## Detailed Implementation

### Version Management

**Step 1: Manual Version Bump**

- Choose the appropriate semantic version increment:
  - `patch`: Bug fixes, documentation updates, minor tweaks
  - `minor`: New features, enhancements (backwards compatible)
  - `major`: Breaking changes, API changes, major refactors
- Run: `npm run release:patch|minor|major`
- This updates `package.json` and generates fresh version info

**Step 2: Automated Deployment**

- Run: `npm run deploy`
- This handles building, syncing, tagging, and pushing automatically
- Version format: `{version}+{timestamp}.{commit}` (e.g., `1.2.3+2025-06-19T14-05-58.8d06dfd`)

### What Each Command Does

**npm run release:patch|minor|major:**

- Updates version in `package.json` using `npm version`
- Generates fresh `version.json` with build metadata
- Creates git tag on source repository

**npm run deploy:**

- Checks git status for uncommitted changes
- Builds project with Vite (`npm run build`)
- Syncs `dist/` to `/home/akrherz/projects/depmap-releases/`
- Commits and tags the release repository
- Prompts before pushing to production

### Build Process

```bash
npm run version:generate  # Generate fresh version info
npm run build            # Vite build to dist/
```

### Rsync Details

```bash
rsync -av --delete dist/ /home/akrherz/projects/depmap-releases/
```

- Copy all contents of `dist/` directory
- Use `--delete` to remove old files
- Preserve permissions with `-a`

### Git Workflow

1. **Source repo (depmap):**
   - Tag with version: `git tag {version}`
   - Push tags: `git push --tags`

2. **Release repo (depmap-releases):**
   - Commit message: `"Release {version}"`
   - Tag with same version
   - Push all: `git push --all && git push --tags`

### Error Handling

- Verify `dist/` exists before rsync
- Check git status before committing
- Confirm version format is valid
- Prompt before pushing to production
