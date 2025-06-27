#!/bin/bash
set -e

echo "🚀 Starting repository sync..."
echo ""

# Check if we're on the main branch
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
    echo "⚠️  Warning: You're on branch '$current_branch', not 'main'"
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Sync cancelled"
        exit 1
    fi
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  You have uncommitted changes:"
    git status --short
    echo ""
    read -p "Commit and continue? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📝 Committing changes..."
        git add .
        read -p "Enter commit message: " commit_msg
        git commit -m "$commit_msg"
    else
        echo "❌ Please commit or stash your changes first"
        exit 1
    fi
fi

echo "1️⃣ Pushing to monorepo (origin)..."
git push origin $current_branch

echo ""
echo "2️⃣ Pushing web subdirectory to web-origin..."
git subtree push --prefix=apps/web web-origin main

echo ""
echo "3️⃣ Pushing AI subdirectory to ai-origin..."
git subtree push --prefix=apps/ai ai-origin main

echo ""
echo "✅ All repositories synced successfully!"
echo ""
echo "📊 Summary:"
echo "  - Monorepo: https://github.com/maratron-ai/maratron-monorepo"
echo "  - Web repo: https://github.com/maratron-ai/maratron-web" 
echo "  - AI repo:  https://github.com/maratron-ai/maratron-ai"