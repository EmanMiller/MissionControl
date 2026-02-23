#!/bin/bash

# Finish feature and prepare for PR
# Usage: ./scripts/finish-feature.sh

CURRENT_BRANCH=$(git branch --show-current)

if [[ $CURRENT_BRANCH != feature/* ]]; then
    echo "❌ Not on a feature branch. Current branch: $CURRENT_BRANCH"
    echo "Usage: Switch to feature branch first, then run this script"
    exit 1
fi

echo "🏁 Finishing feature: $CURRENT_BRANCH"

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  Uncommitted changes detected. Please commit first:"
    git status --porcelain
    exit 1
fi

# Push feature branch
echo "📤 Pushing feature branch to origin..."
git push origin $CURRENT_BRANCH

# Get PR URL
REPO_URL=$(git config --get remote.origin.url | sed 's/\.git$//')
if [[ $REPO_URL == git@github.com:* ]]; then
    REPO_URL=$(echo $REPO_URL | sed 's/git@github.com:/https:\/\/github.com\//')
fi

PR_URL="$REPO_URL/compare/develop...$CURRENT_BRANCH"

echo "✅ Feature branch pushed successfully!"
echo ""
echo "🔗 Create Pull Request:"
echo "   $PR_URL"
echo ""
echo "📋 PR Checklist:"
echo "   - [ ] Title follows conventional commit format"
echo "   - [ ] Description explains what and why"
echo "   - [ ] All tests pass"
echo "   - [ ] Manual testing completed"
echo "   - [ ] No breaking changes"
echo "   - [ ] Documentation updated if needed"
echo ""
echo "🎯 Target branch: develop"