#!/bin/bash

# Create new hotfix branch
# Usage: ./scripts/new-hotfix.sh hotfix-name

if [ $# -eq 0 ]; then
    echo "Usage: ./scripts/new-hotfix.sh <hotfix-name>"
    echo "Example: ./scripts/new-hotfix.sh critical-auth-bug"
    exit 1
fi

HOTFIX_NAME=$1
BRANCH_NAME="hotfix/$HOTFIX_NAME"

echo "🔥 Creating new hotfix branch: $BRANCH_NAME"

# Switch to main and pull latest
git checkout main
git pull origin main

# Create and switch to hotfix branch
git checkout -b $BRANCH_NAME

echo "✅ Created hotfix branch: $BRANCH_NAME"
echo "🚨 Ready for critical fix!"
echo ""
echo "Next steps:"
echo "1. Fix the critical issue"
echo "2. git add ."
echo "3. git commit -m 'hotfix: description of fix'"
echo "4. git push origin $BRANCH_NAME"
echo "5. Create PR: $BRANCH_NAME → main"
echo "6. After merge, also merge to develop"