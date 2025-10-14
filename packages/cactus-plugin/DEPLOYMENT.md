# Deployment Guide

This document explains how to deploy the Cactus Rozenite plugin to npm.

## Prerequisites

1. **npm Account**: Ensure you have an npm account with publish permissions for the `cactus-rozenite` package
2. **npm Login**: Run `npm login` to authenticate with npm
3. **Git**: Ensure git is configured and you're on the correct branch

## Quick Deployment (Recommended)

### Using npm Scripts

For quick deployments, use the predefined npm scripts:

```bash
# Deploy a prerelease version (recommended for testing)
npm run deploy:npm

# Deploy a patch version (bug fixes)
npm run deploy:patch

# Deploy a minor version (new features)
npm run deploy:minor

# Deploy a major version (breaking changes)
npm run deploy:major

# Test what will be published without actually publishing
npm run publish:dry-run
```

### Using the Deployment Script

For more control and safety checks, use the deployment script:

```bash
# Deploy a prerelease (alpha) version
./deploy.sh prerelease

# Deploy a patch version
./deploy.sh patch

# Deploy a minor version
./deploy.sh minor

# Deploy a major version
./deploy.sh major
```

## Deployment Process

The deployment process follows these steps:

1. **Version Bump**: Automatically increments the version number in `package.json`
2. **Build**: Runs `npm run build` to compile the plugin
3. **Publish**: Publishes the package to npm
4. **Git Tag**: Creates a git commit and tag for the new version

## Version Types

- **prerelease**: `1.0.0-alpha.28` → `1.0.0-alpha.29` (published with `@alpha` tag)
- **patch**: `1.0.0` → `1.0.1` (bug fixes)
- **minor**: `1.0.0` → `1.1.0` (new features)
- **major**: `1.0.0` → `2.0.0` (breaking changes)

## Safety Features

The deployment script includes several safety features:

- **Build Verification**: Ensures the build succeeds before publishing
- **Dry Run**: Shows what will be published before confirmation
- **User Confirmation**: Requires explicit confirmation before publishing
- **Git Status Check**: Warns about uncommitted changes
- **npm Authentication**: Verifies you're logged in to npm

## Manual Steps

If you prefer manual control:

```bash
# 1. Bump version manually
npm version patch --no-git-tag-version

# 2. Build the plugin
npm run build

# 3. Test the build
npm publish --dry-run

# 4. Publish to npm
npm publish

# 5. Commit and tag
git add package.json
git commit -m "chore: bump version to $(node -p "require('./package.json').version")"
git tag "v$(node -p "require('./package.json').version")"
```

## After Deployment

1. **Push Changes**: Don't forget to push your commits and tags:
   ```bash
   git push origin main
   git push origin --tags
   ```

2. **Verify Publication**: Check the package on npm:
   - https://www.npmjs.com/package/cactus-rozenite

3. **Test Installation**: Test the published package:
   ```bash
   npm install cactus-rozenite@latest
   # or for prerelease
   npm install cactus-rozenite@alpha
   ```

## Troubleshooting

### "You do not have permission to publish"
- Ensure you're logged in: `npm whoami`
- Check if you have publish permissions for the package
- Contact the package maintainer if needed

### "Version already exists"
- The version number already exists on npm
- Bump to a higher version number
- Check the current published versions: `npm view cactus-rozenite versions --json`

### Build Failures
- Check for TypeScript errors
- Ensure all dependencies are installed
- Verify the rozenite build configuration

## Package Information

- **Package Name**: `cactus-rozenite`
- **Current Version**: Check `package.json` or run `npm view cactus-rozenite version`
- **npm Registry**: https://www.npmjs.com/package/cactus-rozenite