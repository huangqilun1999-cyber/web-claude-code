# Web Claude Code

<div align="center">

![Web Claude Code](https://img.shields.io/badge/Web-Claude%20Code-blue?style=for-the-badge)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)

**A modern web platform to remotely control and use Claude Code from any device.**

[English](README.md) | [中文](README_CN.md) | [Deployment Guide](docs/DEPLOYMENT.md)

</div>

---

## ✨ Features

- 🗣️ **Remote Chat** - Interactive conversations with Claude Code through the web
- 📁 **File Management** - Browse, edit, and save remote files with Monaco Editor
- 💻 **Web Terminal** - Full terminal experience with PTY support
- 🔀 **Git Integration** - Status, commit, push, branch management, and history
- 📋 **Project Templates** - Quick-start various project types
- 🔌 **Plugin System** - Extensible functionality
- 📱 **Mobile Responsive** - Use anywhere, anytime

## 🖼️ Screenshots

<div align="center">
<img src="docs/images/dashboard.png" alt="Dashboard" width="80%">
</div>

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+
- **pnpm** 8+
- **Docker** (for PostgreSQL and Redis) or standalone PostgreSQL
- **Claude Code CLI** (required for local Agent)

### One-Click Deploy (Production)

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh docker
```

**Windows:**
```cmd
deploy.bat docker
```

> For detailed deployment options, see the [Deployment Guide](docs/DEPLOYMENT.md).

### One-Click Start (Development)

**Windows:**
```bash
start-dev.bat
```

**Linux/Mac:**
```bash
chmod +x start-dev.sh
./start-dev.sh
```

The script will automatically:
1. Start PostgreSQL and Redis (via Docker)
2. Install dependencies
3. Build shared packages
4. Initialize database
5. Start WebSocket server (port 8080)
6. Start Web application (port 3000)

### Manual Setup

<details>
<summary>Click to expand manual setup instructions</summary>

1. **Start Database:**
```bash
docker run -d --name wcc-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=web_claude_code \
  -p 5432:5432 \
  postgres:15
```

2. **Install Dependencies:**
```bash
pnpm install
```

3. **Configure Environment Variables:**
```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/ws-server/.env.example apps/ws-server/.env
# Important: Ensure JWT_SECRET is identical in both files!
```

4. **Build Shared Packages:**
```bash
cd packages/shared && pnpm build
```

5. **Initialize Database:**
```bash
cd apps/web
pnpm prisma generate
pnpm prisma db push
```

6. **Start WebSocket Server:**
```bash
cd apps/ws-server && pnpm dev
# Expected: WebSocket server running on port 8080
```

7. **Start Web App (new terminal):**
```bash
cd apps/web && pnpm dev
# Expected: http://localhost:3000
```

8. **Access Application:**
   - Open browser at http://localhost:3000
   - Register and login

</details>

## 📖 Usage Guide

### Step 1: Register and Login

1. Open your browser and navigate to `http://localhost:3000` (or your deployed URL)
2. Click **Register** to create a new account
3. Fill in your email and password
4. Login with your credentials

### Step 2: Create an Agent

1. Navigate to **Dashboard** → **Agents**
2. Click **Create Agent**
3. Enter a name for your Agent (e.g., "My Workstation")
4. Click **Create** - a Secret Key will be generated
5. **Copy and save the Secret Key** (you'll need it later)

### Step 3: Connect Local Agent

On your local machine where you want to run Claude Code:

```bash
# Navigate to the agent directory
cd apps/agent

# Build the agent
pnpm build

# Configure the agent with your server and secret key
pnpm start config -s ws://localhost:8080 -k <your-secret-key>

# Start the agent
pnpm start start
```

Once connected, the Agent status will show as **Online** in the web dashboard.

### Step 4: Start a Chat Session

1. Go to **Dashboard** → **Sessions**
2. Click **New Session**
3. Select your online Agent
4. Set the working directory (default: `/`)
5. Click **Create**
6. Start chatting with Claude!

### Step 5: Use Features

| Feature | How to Access |
|---------|---------------|
| **Chat** | Main chat interface - type messages to Claude |
| **File Explorer** | Click the folder icon in sidebar |
| **Terminal** | Click the terminal icon in sidebar |
| **Git** | Click the git icon in sidebar |
| **Editor** | Click any file in File Explorer |

### Pro Tips

- Use **Ctrl+Enter** to send messages
- Click **Copy** on code blocks to copy to clipboard
- Use the **Theme Toggle** in settings for dark/light mode
- **Pin** important sessions for quick access

## 🔧 Using Local Agent

To run an Agent on your local machine:

```bash
# Build Agent
cd apps/agent && pnpm build

# Configure (get Secret Key from Web dashboard)
pnpm start config -s ws://localhost:8080 -k <your-secret-key>

# Start Agent
pnpm start start
```

Once connected, the Web dashboard will show the Agent as online.

## 📁 Project Structure

```
web-claude-code/
├── apps/
│   ├── web/              # Next.js Web Application
│   │   ├── src/
│   │   │   ├── app/      # App Router pages
│   │   │   ├── components/   # React components
│   │   │   ├── hooks/    # Custom hooks
│   │   │   ├── lib/      # Utilities
│   │   │   └── stores/   # Zustand state management
│   │   └── prisma/       # Database schema
│   ├── ws-server/        # WebSocket Server
│   │   └── src/
│   │       ├── handlers/ # Message handlers
│   │       └── services/ # Connection management
│   └── agent/            # Local Agent
│       └── src/
│           └── handlers/ # Feature handlers
├── packages/
│   ├── shared/           # Shared types & utilities
│   └── plugin-sdk/       # Plugin development SDK
├── templates/            # Project templates
├── plugins/              # Official plugins
└── docs/                 # Documentation
```

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 14, React 18, TypeScript 5.3, Tailwind CSS 3.4 |
| State Management | Zustand 4.5, TanStack Query 5.28 |
| Code Editor | Monaco Editor 0.45 |
| Terminal | xterm.js 5.3 |
| Backend API | Next.js API Routes |
| WebSocket | ws 8.16 (Node.js) |
| Database | PostgreSQL 15, Prisma 5.22 |
| Cache | Redis 7 |
| Authentication | NextAuth.js 4.24 |
| Monorepo | Turbo 2.7, pnpm workspaces |
| Agent | Node.js, Commander.js, node-pty |

## ⚙️ Environment Variables

### apps/web/.env.local

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/web_claude_code"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
JWT_SECRET="your-jwt-secret"
ENCRYPTION_KEY="12345678901234567890123456789012"  # Must be 32 chars
NEXT_PUBLIC_WS_URL="ws://localhost:8080"
```

### apps/ws-server/.env

```env
WS_PORT=8080
JWT_SECRET="your-jwt-secret"  # Must match web
ENCRYPTION_KEY="12345678901234567890123456789012"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/web_claude_code"
```

## 🚢 Deployment

For production deployment, see the [Deployment Guide](docs/DEPLOYMENT.md).

Quick deploy commands:

```bash
# Docker deployment (recommended)
./deploy.sh docker

# Local build
./deploy.sh local

# Setup environment only
./deploy.sh setup

# Create PM2 config
./deploy.sh pm2
```

## 🐛 Troubleshooting

<details>
<summary><b>WebSocket connection failed</b></summary>

- Check `NEXT_PUBLIC_WS_URL` configuration
- Confirm ws-server is running
- Check if port is in use
</details>

<details>
<summary><b>Database connection failed</b></summary>

- Confirm PostgreSQL is running
- Check `DATABASE_URL` configuration
- Run `pnpm prisma db push` to initialize
</details>

<details>
<summary><b>Redirected to login after authentication</b></summary>

- Ensure `JWT_SECRET` is identical in web and ws-server
- Clear browser cookies
- Check NextAuth configuration
</details>

<details>
<summary><b>Agent cannot connect</b></summary>

- Verify Secret Key is correct
- Confirm server URL format (ws:// or wss://)
- Check Agent logs for errors
</details>

## 🛑 Stopping Services

**Windows:**
```bash
stop-dev.bat
```

**Linux/Mac:**
Press `Ctrl+C` to stop all services.

**Docker:**
```bash
docker compose down
```

## 📝 Development

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Clean build
pnpm clean
```

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Anthropic](https://anthropic.com) for Claude
- [Claude Code](https://github.com/anthropics/claude-code) CLI
- All contributors and supporters

---

<div align="center">

**If you find this project useful, please consider giving it a ⭐️**

</div>
