#!/bin/bash

# Cactus Rozenite Plugin Deployment Script
# Usage: ./deploy.sh [patch|minor|major|prerelease]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "rozenite.config.js" ]; then
    print_error "This script must be run from the cactus-plugin directory"
    exit 1
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
print_status "Current version: $CURRENT_VERSION"

# Determine version bump type
VERSION_TYPE=${1:-prerelease}

if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major|prerelease)$ ]]; then
    print_error "Invalid version type. Use: patch, minor, major, or prerelease"
    exit 1
fi

print_status "Version bump type: $VERSION_TYPE"

# Check if user is logged in to npm
if ! npm whoami > /dev/null 2>&1; then
    print_error "You are not logged in to npm. Run 'npm login' first."
    exit 1
fi

NPM_USER=$(npm whoami)
print_status "Logged in as: $NPM_USER"

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    print_warning "You have uncommitted changes. Consider committing them first."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Deployment cancelled."
        exit 0
    fi
fi

# Bump version
print_status "Bumping version ($VERSION_TYPE)..."
npm version $VERSION_TYPE --no-git-tag-version

NEW_VERSION=$(node -p "require('./package.json').version")
print_success "Version bumped to: $NEW_VERSION"

# Build the plugin
print_status "Building plugin..."
if npm run build; then
    print_success "Build completed successfully"
else
    print_error "Build failed"
    exit 1
fi

# Dry run to check what will be published
print_status "Running publish dry-run..."
npm publish --dry-run

# Confirm publication
echo
print_warning "About to publish cactus-rozenite@$NEW_VERSION to npm"
read -p "Continue with publication? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_status "Publication cancelled."
    # Revert version bump
    git checkout -- package.json
    print_status "Version reverted to $CURRENT_VERSION"
    exit 0
fi

# Publish to npm
print_status "Publishing to npm..."
if [[ "$VERSION_TYPE" == "prerelease" ]]; then
    # Publish prerelease with alpha tag
    if npm publish --tag alpha; then
        print_success "Successfully published cactus-rozenite@$NEW_VERSION with alpha tag"
    else
        print_error "Publication failed"
        exit 1
    fi
else
    # Publish stable release
    if npm publish; then
        print_success "Successfully published cactus-rozenite@$NEW_VERSION"
    else
        print_error "Publication failed"
        exit 1
    fi
fi

# Create git tag and commit
print_status "Creating git commit and tag..."
git add package.json
git commit -m "chore: bump version to $NEW_VERSION"
git tag "v$NEW_VERSION"

print_success "Deployment completed successfully!"
print_status "Version: $NEW_VERSION"
print_status "Published to: https://www.npmjs.com/package/cactus-rozenite"

if [[ "$VERSION_TYPE" == "prerelease" ]]; then
    print_status "Install with: npm install cactus-rozenite@alpha"
else
    print_status "Install with: npm install cactus-rozenite@$NEW_VERSION"
fi

echo
print_status "Don't forget to push your changes:"
echo "  git push origin main"
echo "  git push origin v$NEW_VERSION"