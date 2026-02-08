#!/bin/bash
set -e

# Build for production (base-href / for Cloudflare Pages)
echo "Building for Cloudflare Pages (dev)..."
ionic build --prod -- --base-href /

# Add Cloudflare Pages SPA routing
echo "/* /index.html 200" > www/_redirects

# Deploy to Cloudflare Pages (dev preview branch)
echo "Deploying to Cloudflare Pages (dev)..."
npx wrangler pages deploy www --project-name=mojidoodle-dev --branch=main --commit-dirty=true

echo ""
echo "Deployed to https://dev.mojidoodle.ai/"
