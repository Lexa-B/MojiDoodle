#!/bin/bash
set -e

# Build for production
echo "Building for production..."
ionic build --prod -- --base-href /MojiDoodle/

# Clone gh-pages branch to temp directory
TEMP_DIR=$(mktemp -d)
echo "Cloning gh-pages to $TEMP_DIR..."
git clone --branch gh-pages --single-branch --depth 1 "$(git remote get-url origin)" "$TEMP_DIR"

# Remove everything except /dev directory, then copy new build
echo "Updating root (preserving /dev)..."
cd "$TEMP_DIR"
find . -maxdepth 1 ! -name '.' ! -name '.git' ! -name 'dev' -exec rm -rf {} +
cd -
cp -r www/* "$TEMP_DIR/"

# Commit and push
cd "$TEMP_DIR"
git add -A
git commit -m "Deploy $(date -u +%Y-%m-%dT%H:%M:%SZ)" || echo "No changes to commit"
git push origin gh-pages

# Cleanup
cd -
rm -rf "$TEMP_DIR"

echo "Deployed to https://lexa-b.github.io/MojiDoodle/"
