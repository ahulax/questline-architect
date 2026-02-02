#!/bin/bash

# Force Sync Script for Vercel Deployment

echo "🚀 Starting Deployment Sync..."

# 1. Check for uncommitted changes
if [[ -z $(git status -s) ]]; then
  echo "✅ No local changes to deploy."
else
  echo "📦 Found uncommitted changes. Staging..."
  git add .
  
  echo "📝 Committing..."
  git commit -m "chore: auto-sync for deployment $(date +'%Y-%m-%d %H:%M:%S')"
  
  echo "⬆️ Pushing to GitHub (Triggers Vercel)..."
  git push origin main
  
  echo "✅ Git push complete."
  
  # Try Vercel Direct
  if npx vercel whoami &> /dev/null; then
    echo "🚀 Triggering Vercel Direct Deployment..."
    npx vercel deploy --prod
    echo "✅ Vercel Direct Deployment Triggered."
  else
    echo "⚠️  Vercel CLI not authenticated. Skipping direct deploy."
    echo "👉 Run 'npx vercel login' locally to enable direct deployments."
  fi
fi
