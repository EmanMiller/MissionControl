# Contributing to Mission Control

Thank you for your interest in contributing to Mission Control! This document provides guidelines and information for contributors.

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Install dependencies**:
   ```bash
   npm install
   cd server && npm install && cd ..
   ```
4. **Set up environment** variables (see README.md)
5. **Create a feature branch**: `git checkout -b feature/your-feature-name`

## 🔧 Development Workflow

### Branch Strategy
- `main` - Production-ready code
- `develop` - Integration branch for features  
- `feature/*` - New features
- `hotfix/*` - Critical bug fixes

### Code Style
- **Frontend**: React + Tailwind CSS
- **Backend**: Express.js with ES modules
- **Database**: SQLite (dev) / PostgreSQL (production)
- **Authentication**: OAuth + JWT

### Testing
```bash
# Run all tests
npm run test-system

# Build check
npm run build
```

## 📋 Pull Request Process

1. **Update your branch** with latest main/develop
2. **Test your changes** thoroughly
3. **Update documentation** if needed
4. **Submit PR** with clear description
5. **Address review feedback**

### PR Checklist
- [ ] Code follows project conventions
- [ ] Tests pass
- [ ] Build succeeds
- [ ] Documentation updated
- [ ] No console errors
- [ ] Mobile responsive (if UI changes)

## 🐛 Bug Reports

Use GitHub Issues with:
- **Clear title** and description
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Environment details** (browser, OS, etc.)
- **Screenshots** if applicable

## 💡 Feature Requests

We welcome feature requests! Please:
- **Search existing issues** first
- **Describe the problem** you're solving
- **Explain your proposed solution**
- **Consider implementation complexity**

## 🏗️ Architecture Guidelines

### Frontend
- **Responsive first**: Mobile → Desktop
- **Component-based**: Reusable React components
- **State management**: React hooks + local state
- **Styling**: Tailwind utility classes

### Backend  
- **RESTful APIs**: Clear endpoint design
- **Security first**: Input validation, rate limiting
- **Database**: Proper migrations and schema
- **Error handling**: Consistent error responses

## 🔒 Security

- **Never commit secrets** or credentials
- **Use environment variables** for configuration
- **Follow OAuth best practices**
- **Validate all inputs**
- **Report security issues** privately

## 📞 Getting Help

- **GitHub Discussions** for questions
- **GitHub Issues** for bugs/features
- **README.md** for setup instructions

## 🎯 Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help newcomers get started
- Follow GitHub community guidelines

## 🏆 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- GitHub contributors page

Thank you for making Mission Control better! 🚀