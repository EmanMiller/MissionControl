#!/bin/bash

# Create new feature branch
# Usage: ./scripts/new-feature.sh feature-name

if [ $# -eq 0 ]; then
    echo "Usage: ./scripts/new-feature.sh <feature-name>"
    echo "Example: ./scripts/new-feature.sh oauth-integration"
    exit 1
fi

FEATURE_NAME=$1
BRANCH_NAME="feature/$FEATURE_NAME"

echo "🚀 Creating new feature branch: $BRANCH_NAME"

# Switch to develop and pull latest
git checkout develop
git pull origin develop

# Create and switch to feature branch
git checkout -b $BRANCH_NAME

echo "✅ Created feature branch: $BRANCH_NAME"
echo "📝 Ready to start development!"
echo ""
echo "Next steps:"
echo "1. Make your changes"
echo "2. git add ."
echo "3. git commit -m 'feat: description of changes'"
echo "4. git push origin $BRANCH_NAME"
echo "5. Create PR: $BRANCH_NAME → develop"