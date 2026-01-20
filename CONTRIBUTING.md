# Contributing to Web Claude Code

First off, thank you for considering contributing to Web Claude Code! It's people like you that make this project great.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct:

- Be respectful and inclusive
- Be patient with newcomers
- Focus on what is best for the community
- Show empathy towards other community members

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (code snippets, screenshots)
- **Describe the behavior you observed and what you expected**
- **Include your environment details** (OS, Node.js version, browser)

### Suggesting Features

Feature suggestions are welcome! Please provide:

- **A clear and descriptive title**
- **Detailed description of the proposed feature**
- **Explain why this feature would be useful**
- **List any alternatives you've considered**

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Install dependencies**: `pnpm install`
3. **Make your changes** following our coding standards
4. **Add tests** if applicable
5. **Ensure tests pass**: `pnpm test`
6. **Lint your code**: `pnpm lint`
7. **Commit your changes** using conventional commits
8. **Push to your fork** and submit a pull request

## Development Setup

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker (for PostgreSQL and Redis)

### Getting Started

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/web-claude-code.git
cd web-claude-code

# Install dependencies
pnpm install

# Set up environment variables
cp apps/web/.env.example apps/web/.env.local
cp apps/ws-server/.env.example apps/ws-server/.env

# Start development services
./start-dev.sh  # or start-dev.bat on Windows
```

### Project Structure

- `apps/web` - Next.js web application
- `apps/ws-server` - WebSocket server
- `apps/agent` - Local agent CLI
- `packages/shared` - Shared types and utilities
- `packages/plugin-sdk` - Plugin development SDK

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Avoid `any` type - use proper typing
- Export types and interfaces from `packages/shared`

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add trailing commas
- Maximum line length: 100 characters

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(web): add dark mode toggle
fix(ws-server): resolve connection timeout issue
docs: update README with new setup instructions
```

### Testing

- Write tests for new features
- Ensure existing tests pass before submitting PR
- Run `pnpm test` to execute tests

## Review Process

1. A maintainer will review your PR
2. Changes may be requested
3. Once approved, your PR will be merged
4. Your contribution will be acknowledged in the project

## Questions?

Feel free to open an issue with the "question" label if you have any questions about contributing.

---

Thank you for contributing! 🎉
