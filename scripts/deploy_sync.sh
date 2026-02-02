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
  
  echo "✅ Deploy Triggered! Check Vercel dashboard."
fi
