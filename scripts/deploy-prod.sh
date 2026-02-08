#!/bin/bash
set -e

# Build for production (base-href / for Cloudflare Pages)
echo "Building for Cloudflare Pages (production)..."
ionic build --prod -- --base-href /

# Add Cloudflare Pages SPA routing
echo "/* /index.html 200" > www/_redirects

# Deploy to Cloudflare Pages (production)
echo "Deploying to Cloudflare Pages (production)..."
npx wrangler pages deploy www --project-name=mojidoodle-prod --branch=main --commit-dirty=true

echo ""
echo "Deployed to https://app.mojidoodle.ai/"
