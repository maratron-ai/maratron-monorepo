#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_usage() {
    echo "Usage: $0 [push|pull|both]"
    echo ""
    echo "Commands:"
    echo "  push  - Push changes from monorepo to separate repositories"
    echo "  pull  - Pull changes from separate repositories to monorepo"
    echo "  both  - Pull first, then push (recommended for syncing)"
    echo ""
    echo "Examples:"
    echo "  $0 push   # Push your local changes"
    echo "  $0 pull   # Pull external changes"
    echo "  $0 both   # Full bidirectional sync"
}

check_prerequisites() {
    # Check if we're on the main branch
    current_branch=$(git branch --show-current)
    if [ "$current_branch" != "main" ]; then
        echo -e "${YELLOW}⚠️  Warning: You're on branch '$current_branch', not 'main'${NC}"
        read -p "Continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${RED}❌ Operation cancelled${NC}"
            exit 1
        fi
    fi
}

pull_changes() {
    echo -e "${BLUE}⬇️ Pulling changes from separate repositories...${NC}"
    echo ""

    # Check for uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${YELLOW}⚠️  You have uncommitted changes. Please commit or stash them first.${NC}"
        git status --short
        exit 1
    fi

    echo "1️⃣ Pulling changes from web-origin..."
    if git subtree pull --prefix=apps/web web-origin main --squash -m "Pull web changes from separate repository"; then
        echo -e "${GREEN}✅ Web changes pulled successfully${NC}"
    else
        echo -e "${YELLOW}⚠️  No changes to pull from web repository${NC}"
    fi

    echo ""
    echo "2️⃣ Pulling changes from ai-origin..."
    if git subtree pull --prefix=apps/ai ai-origin main --squash -m "Pull AI changes from separate repository"; then
        echo -e "${GREEN}✅ AI changes pulled successfully${NC}"
    else
        echo -e "${YELLOW}⚠️  No changes to pull from AI repository${NC}"
    fi

    echo ""
    echo -e "${GREEN}✅ Pull operation completed!${NC}"
}

push_changes() {
    echo -e "${BLUE}⬆️ Pushing changes to separate repositories...${NC}"
    echo ""

    # Check for uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${YELLOW}⚠️  You have uncommitted changes:${NC}"
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
            echo -e "${RED}❌ Please commit or stash your changes first${NC}"
            exit 1
        fi
    fi

    echo "1️⃣ Pushing to monorepo (origin)..."
    git push origin $current_branch

    echo ""
    echo "2️⃣ Force pushing web subdirectory to web-origin (overwriting main)..."
    git push --force web-origin `git subtree split --prefix=apps/web $current_branch`:main

    echo ""
    echo "3️⃣ Force pushing AI subdirectory to ai-origin (overwriting main)..."
    git push --force ai-origin `git subtree split --prefix=apps/ai $current_branch`:main

    echo ""
    echo -e "${GREEN}✅ Push operation completed!${NC}"
}

# Main script logic
if [ $# -eq 0 ]; then
    print_usage
    exit 1
fi

current_branch=$(git branch --show-current)

case "$1" in
    "push")
        echo -e "${BLUE}🚀 Starting push operation...${NC}"
        check_prerequisites
        push_changes
        ;;
    "pull")
        echo -e "${BLUE}🚀 Starting pull operation...${NC}"
        check_prerequisites
        pull_changes
        ;;
    "both")
        echo -e "${BLUE}🚀 Starting bidirectional sync...${NC}"
        check_prerequisites
        pull_changes
        echo ""
        push_changes
        ;;
    *)
        echo -e "${RED}❌ Invalid command: $1${NC}"
        echo ""
        print_usage
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}📊 Summary:${NC}"
echo "  - Monorepo: https://github.com/maratron-ai/maratron-monorepo"
echo "  - Web repo: https://github.com/maratron-ai/maratron-web"
echo "  - AI repo:  https://github.com/maratron-ai/maratron-ai"
echo ""
echo -e "${BLUE}💡 Usage tips:${NC}"
echo "  - Use 'pull' to get external changes"
echo "  - Use 'push' to publish your changes (overwrites main)"
echo "  - Use 'both' for complete synchronization"