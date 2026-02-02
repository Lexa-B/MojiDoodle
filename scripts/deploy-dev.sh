#!/bin/bash
set -e

# Build for dev subdirectory
echo "Building for dev..."
ionic build --prod -- --base-href /MojiDoodle/dev/

# Clone gh-pages branch to temp directory
TEMP_DIR=$(mktemp -d)
echo "Cloning gh-pages to $TEMP_DIR..."
git clone --branch gh-pages --single-branch --depth 1 "$(git remote get-url origin)" "$TEMP_DIR"

# Remove old dev directory and copy new build
echo "Updating dev directory..."
rm -rf "$TEMP_DIR/dev"
cp -r www "$TEMP_DIR/dev"

# Commit and push
cd "$TEMP_DIR"
git add -A
git commit -m "Deploy dev build $(date -u +%Y-%m-%dT%H:%M:%SZ)" || echo "No changes to commit"
git push origin gh-pages

# Cleanup
cd -
rm -rf "$TEMP_DIR"

echo "Deployed to https://lexa-b.github.io/MojiDoodle/dev/"
