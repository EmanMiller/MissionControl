#!/bin/bash

# Show Git Flow status
# Usage: ./scripts/git-status.sh

echo "📊 Mission Control - Git Workflow Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "🔍 Current Branch: $CURRENT_BRANCH"

# Branch type classification
if [[ $CURRENT_BRANCH == "main" ]]; then
    echo "   Type: Production branch ⚠️"
    echo "   Warning: Direct commits to main not recommended!"
elif [[ $CURRENT_BRANCH == "develop" ]]; then
    echo "   Type: Development branch ✅"
    echo "   Safe for integration work"
elif [[ $CURRENT_BRANCH == feature/* ]]; then
    echo "   Type: Feature branch ✅"
    echo "   Target merge: develop"
elif [[ $CURRENT_BRANCH == hotfix/* ]]; then
    echo "   Type: Hotfix branch 🔥"
    echo "   Target merge: main → develop"
elif [[ $CURRENT_BRANCH == bugfix/* ]]; then
    echo "   Type: Bugfix branch 🐛"
    echo "   Target merge: develop"
elif [[ $CURRENT_BRANCH == release/* ]]; then
    echo "   Type: Release branch 📦"
    echo "   Target merge: main → develop"
else
    echo "   Type: Unknown branch type ❓"
fi

echo ""

# Uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  Uncommitted Changes:"
    git status --porcelain | head -10
    if [ $(git status --porcelain | wc -l) -gt 10 ]; then
        echo "   ... and $(( $(git status --porcelain | wc -l) - 10 )) more files"
    fi
else
    echo "✅ No uncommitted changes"
fi

echo ""

# Branch comparison
echo "📈 Branch Status:"

# Compare with develop
if [ "$CURRENT_BRANCH" != "develop" ]; then
    AHEAD_DEVELOP=$(git rev-list --count develop..$CURRENT_BRANCH 2>/dev/null || echo "0")
    BEHIND_DEVELOP=$(git rev-list --count $CURRENT_BRANCH..develop 2>/dev/null || echo "0")
    echo "   vs develop: +$AHEAD_DEVELOP −$BEHIND_DEVELOP commits"
fi

# Compare with main
if [ "$CURRENT_BRANCH" != "main" ]; then
    AHEAD_MAIN=$(git rev-list --count main..$CURRENT_BRANCH 2>/dev/null || echo "0")
    BEHIND_MAIN=$(git rev-list --count $CURRENT_BRANCH..main 2>/dev/null || echo "0")
    echo "   vs main: +$AHEAD_MAIN −$BEHIND_MAIN commits"
fi

echo ""

# Recent commits
echo "📝 Recent Commits (last 3):"
git log --oneline -3 --color=always

echo ""

# Available branches
echo "🌿 Available Branches:"
git branch -a --color=always | grep -E "(feature|hotfix|bugfix|release|main|develop)" | head -10

echo ""

# Quick commands
echo "🚀 Quick Commands:"
echo "   New feature:    ./scripts/new-feature.sh <name>"
echo "   New hotfix:     ./scripts/new-hotfix.sh <name>"
echo "   Finish feature: ./scripts/finish-feature.sh"
echo "   See workflow:   cat GIT_WORKFLOW.md"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"