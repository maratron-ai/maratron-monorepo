#!/bin/bash
set -e

echo "⬇️ Pulling changes from separate repositories..."
echo ""

# Check if we're on the main branch
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
    echo "⚠️  Warning: You're on branch '$current_branch', not 'main'"
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Pull cancelled"
        exit 1
    fi
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  You have uncommitted changes. Please commit or stash them first."
    git status --short
    exit 1
fi

echo "1️⃣ Pulling changes from web-origin..."
if git subtree pull --prefix=apps/web web-origin main --squash; then
    echo "✅ Web changes pulled successfully"
else
    echo "⚠️  No changes to pull from web repository or merge conflict"
fi

echo ""
echo "2️⃣ Pulling changes from ai-origin..."
if git subtree pull --prefix=apps/ai ai-origin main --squash; then
    echo "✅ AI changes pulled successfully"
else
    echo "⚠️  No changes to pull from AI repository or merge conflict"
fi

echo ""
echo "✅ Pull operation completed!"
echo ""
echo "📊 Summary:"
echo "  - Changes from web repo pulled into apps/web/"
echo "  - Changes from AI repo pulled into apps/ai/"
echo ""
echo "💡 Next steps:"
echo "  - Review the changes with 'git log --oneline -10'"
echo "  - Run './sync-repos.sh' to push any local changes"