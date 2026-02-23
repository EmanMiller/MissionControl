# Git Workflow - Proper Branching Strategy

Mission Control uses **Git Flow** branching strategy for organized development.

## Branch Structure

### Main Branches
- **`main`** - Production-ready code only
- **`develop`** - Main development branch, integration of features

### Supporting Branches
- **`feature/*`** - New features and enhancements  
- **`hotfix/*`** - Critical production fixes
- **`bugfix/*`** - Non-critical bug fixes
- **`release/*`** - Release preparation

## Workflow

### 🚀 For New Features
```bash
# Start from develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/feature-name

# Work on feature
git add .
git commit -m "feat: add new feature"

# Push and create PR to develop
git push origin feature/feature-name
# Create PR: feature/feature-name → develop
```

### 🔥 For Critical Hotfixes (Production Issues)
```bash
# Start from main (production)
git checkout main
git pull origin main

# Create hotfix branch  
git checkout -b hotfix/critical-issue-name

# Fix the issue
git add .
git commit -m "fix: resolve critical production issue"

# Push and create PR to main
git push origin hotfix/critical-issue-name
# Create PR: hotfix/critical-issue-name → main

# Also merge back to develop
git checkout develop
git merge hotfix/critical-issue-name
```

### 🐛 For Regular Bug Fixes
```bash
# Start from develop
git checkout develop
git pull origin develop

# Create bugfix branch
git checkout -b bugfix/issue-name

# Fix the bug
git add .
git commit -m "fix: resolve issue description"

# Push and create PR to develop
git push origin bugfix/issue-name  
# Create PR: bugfix/issue-name → develop
```

### 📦 For Releases
```bash
# Start from develop
git checkout develop
git pull origin develop

# Create release branch
git checkout -b release/v1.2.0

# Finalize release (version updates, final testing)
git add .
git commit -m "chore: prepare v1.2.0 release"

# Push and create PR to main
git push origin release/v1.2.0
# Create PR: release/v1.2.0 → main

# After merge, tag the release
git checkout main
git tag v1.2.0
git push origin v1.2.0

# Merge back to develop
git checkout develop
git merge main
```

## Branch Naming Conventions

### Feature Branches
- `feature/oauth-integration`
- `feature/task-management-ui`
- `feature/openclaw-webhooks`

### Hotfix Branches  
- `hotfix/critical-auth-bug`
- `hotfix/database-connection-issue`
- `hotfix/security-vulnerability`

### Bugfix Branches
- `bugfix/ui-alignment-issues`
- `bugfix/task-status-updates`
- `bugfix/memory-leak`

### Release Branches
- `release/v1.0.0`
- `release/v1.1.0`
- `release/v2.0.0-beta`

## Commit Message Format

Use **Conventional Commits** format:

```
type(scope): description

[optional body]

[optional footer]
```

### Types
- `feat` - New feature
- `fix` - Bug fix
- `hotfix` - Critical production fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Adding tests
- `chore` - Maintenance tasks (dependencies, build, etc.)

### Examples
```bash
feat(auth): add Google OAuth integration
fix(tasks): resolve task status update issue  
hotfix(security): patch JWT vulnerability
docs(readme): update installation instructions
style(components): format with prettier
refactor(api): optimize database queries
test(auth): add OAuth integration tests
chore(deps): update React to v18.3.1
```

## Pull Request Guidelines

### PR Title Format
- Use conventional commit format
- Be descriptive and specific

### PR Description Template
```markdown
## What changed
Brief description of changes

## Why
Reason for the change

## Testing
- [ ] Unit tests pass
- [ ] Manual testing completed  
- [ ] No breaking changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No merge conflicts
```

### Review Requirements
- At least 1 approval required
- All CI checks must pass
- No merge conflicts
- Branch up to date with target

## Quick Commands

### Create Feature Branch
```bash
./scripts/new-feature.sh feature-name
```

### Create Hotfix Branch  
```bash
./scripts/new-hotfix.sh hotfix-name
```

### Finish Feature (PR ready)
```bash
./scripts/finish-feature.sh feature-name
```

## Current Status

- ✅ **`main`** - Production ready
- ✅ **`develop`** - Active development 
- 🔄 **All future work** - Proper branching workflow

## Rules

1. **NEVER** commit directly to `main`
2. **ALWAYS** create PR for code review
3. **Hotfixes** go to `main`, then back to `develop`  
4. **Features** go to `develop`, then to `main` via release
5. **Delete** feature branches after merge
6. **Tag** releases on `main`

This ensures clean, organized development with proper review processes.