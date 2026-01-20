#!/bin/bash

#######################################
#  Web Claude Code - One-Click Deploy
#  Production Deployment Script
#######################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Banner
echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════╗"
echo "║     Web Claude Code - Production Deploy      ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"
DEPLOY_MODE="${1:-docker}"  # docker, local, or setup

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 is not installed!"
        return 1
    fi
    return 0
}

generate_secret() {
    openssl rand -base64 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1
}

generate_encryption_key() {
    openssl rand -hex 16 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1
}

# Setup environment file
setup_env() {
    log_info "Setting up environment configuration..."

    if [ -f "$ENV_FILE" ]; then
        read -p "Environment file exists. Overwrite? (y/n): " OVERWRITE
        if [ "$OVERWRITE" != "y" ]; then
            log_info "Using existing environment file."
            return
        fi
    fi

    # Generate secrets
    POSTGRES_PASSWORD=$(generate_secret)
    JWT_SECRET=$(generate_secret)
    NEXTAUTH_SECRET=$(generate_secret)
    ENCRYPTION_KEY=$(generate_encryption_key)

    # Get deployment URL
    echo
    read -p "Enter your domain (e.g., example.com) or press Enter for localhost: " DOMAIN
    DOMAIN=${DOMAIN:-localhost}

    if [ "$DOMAIN" = "localhost" ]; then
        PROTOCOL="http"
        WS_PROTOCOL="ws"
        WEB_URL="http://localhost:3000"
        WS_URL="ws://localhost:8080"
    else
        PROTOCOL="https"
        WS_PROTOCOL="wss"
        WEB_URL="https://$DOMAIN"
        WS_URL="wss://$DOMAIN/ws"
    fi

    # Create .env file
    cat > "$ENV_FILE" << EOF
# Web Claude Code - Production Environment
# Generated on $(date)

# Database
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
DATABASE_URL=postgresql://postgres:$POSTGRES_PASSWORD@postgres:5432/web_claude_code

# Authentication
JWT_SECRET=$JWT_SECRET
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
NEXTAUTH_URL=$WEB_URL

# Encryption (must be exactly 32 characters)
ENCRYPTION_KEY=$ENCRYPTION_KEY

# URLs
NEXT_PUBLIC_WS_URL=$WS_URL

# Domain
DOMAIN=$DOMAIN
EOF

    # Create local env files
    mkdir -p apps/web apps/ws-server

    cat > "apps/web/.env.local" << EOF
DATABASE_URL=postgresql://postgres:$POSTGRES_PASSWORD@localhost:5432/web_claude_code
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
NEXTAUTH_URL=$WEB_URL
JWT_SECRET=$JWT_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY
NEXT_PUBLIC_WS_URL=$WS_URL
EOF

    cat > "apps/ws-server/.env" << EOF
WS_PORT=8080
JWT_SECRET=$JWT_SECRET
ENCRYPTION_KEY=$ENCRYPTION_KEY
DATABASE_URL=postgresql://postgres:$POSTGRES_PASSWORD@localhost:5432/web_claude_code
EOF

    log_success "Environment files created!"
    echo
    log_warn "IMPORTANT: Save your credentials somewhere safe!"
    echo "  PostgreSQL Password: $POSTGRES_PASSWORD"
    echo "  JWT Secret: $JWT_SECRET"
    echo
}

# Docker deployment
deploy_docker() {
    log_info "Starting Docker deployment..."

    # Check Docker
    if ! check_command docker; then
        log_error "Docker is required for this deployment method."
        log_info "Install Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi

    if ! check_command docker-compose && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is required."
        exit 1
    fi

    # Check if .env exists
    if [ ! -f "$ENV_FILE" ]; then
        log_warn "No environment file found. Running setup..."
        setup_env
    fi

    # Load environment
    source "$ENV_FILE"

    # Create Dockerfiles if not exist
    create_dockerfiles

    # Build and start
    log_info "Building Docker images..."
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
    fi

    $COMPOSE_CMD build

    log_info "Starting services..."
    $COMPOSE_CMD up -d

    # Wait for services
    log_info "Waiting for services to be ready..."
    sleep 10

    # Run database migrations
    log_info "Running database migrations..."
    $COMPOSE_CMD exec -T web npx prisma db push --accept-data-loss 2>/dev/null || true

    echo
    log_success "Deployment complete!"
    echo
    echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║           Services are running!              ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
    echo
    echo "  Web App:     http://localhost:3000"
    echo "  WebSocket:   ws://localhost:8080"
    echo
    echo "  Commands:"
    echo "    View logs:    $COMPOSE_CMD logs -f"
    echo "    Stop:         $COMPOSE_CMD down"
    echo "    Restart:      $COMPOSE_CMD restart"
    echo
}

# Local deployment (without Docker)
deploy_local() {
    log_info "Starting local deployment..."

    # Check requirements
    check_command node || { log_error "Node.js is required"; exit 1; }
    check_command pnpm || { log_error "pnpm is required. Install: npm install -g pnpm"; exit 1; }

    # Check Node version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        log_error "Node.js 20+ is required. Current: $(node -v)"
        exit 1
    fi

    # Check if .env exists
    if [ ! -f "apps/web/.env.local" ]; then
        log_warn "No environment file found. Running setup..."
        setup_env
    fi

    # Install dependencies
    log_info "Installing dependencies..."
    pnpm install

    # Build shared package
    log_info "Building shared package..."
    cd packages/shared && pnpm build && cd ../..

    # Generate Prisma client
    log_info "Generating Prisma client..."
    cd apps/web && pnpm prisma generate && cd ../..

    # Build applications
    log_info "Building applications..."
    pnpm build

    # Database migration
    log_info "Running database migrations..."
    cd apps/web && pnpm prisma db push --accept-data-loss && cd ../..

    echo
    log_success "Build complete!"
    echo
    echo "To start the services, run:"
    echo "  1. Start WebSocket server: cd apps/ws-server && pnpm start"
    echo "  2. Start Web app: cd apps/web && pnpm start"
    echo
    echo "Or use PM2 for production:"
    echo "  pm2 start ecosystem.config.js"
    echo
}

# Create Dockerfiles
create_dockerfiles() {
    # Web Dockerfile
    if [ ! -f "apps/web/Dockerfile" ]; then
        log_info "Creating Web Dockerfile..."
        cat > "apps/web/Dockerfile" << 'DOCKERFILE'
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8 --activate

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared package
FROM base AS shared-builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@8 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY packages/shared ./packages/shared
RUN cd packages/shared && pnpm build

# Build the app
FROM base AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@8 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=shared-builder /app/packages/shared ./packages/shared
COPY apps/web ./apps/web
COPY package.json pnpm-workspace.yaml ./

# Generate Prisma client
RUN cd apps/web && npx prisma generate

# Build
ENV NEXT_TELEMETRY_DISABLED 1
RUN cd apps/web && pnpm build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/prisma ./apps/web/prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "apps/web/server.js"]
DOCKERFILE
    fi

    # WebSocket Server Dockerfile
    if [ ! -f "apps/ws-server/Dockerfile" ]; then
        log_info "Creating WebSocket Server Dockerfile..."
        cat > "apps/ws-server/Dockerfile" << 'DOCKERFILE'
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@8 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/ws-server/package.json ./apps/ws-server/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

# Build shared package
FROM base AS shared-builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@8 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY packages/shared ./packages/shared
RUN cd packages/shared && pnpm build

# Build the app
FROM base AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@8 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/ws-server/node_modules ./apps/ws-server/node_modules
COPY --from=shared-builder /app/packages/shared ./packages/shared
COPY apps/ws-server ./apps/ws-server
COPY package.json pnpm-workspace.yaml ./

RUN cd apps/ws-server && pnpm build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 wsserver

COPY --from=builder --chown=wsserver:nodejs /app/apps/ws-server/dist ./apps/ws-server/dist
COPY --from=builder /app/apps/ws-server/package.json ./apps/ws-server/
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/ws-server/node_modules ./apps/ws-server/node_modules

USER wsserver

EXPOSE 8080

CMD ["node", "apps/ws-server/dist/index.js"]
DOCKERFILE
    fi
}

# Create PM2 ecosystem file
create_pm2_config() {
    log_info "Creating PM2 configuration..."
    cat > "ecosystem.config.js" << 'EOF'
module.exports = {
  apps: [
    {
      name: 'wcc-web',
      cwd: './apps/web',
      script: 'pnpm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'wcc-ws-server',
      cwd: './apps/ws-server',
      script: 'pnpm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        WS_PORT: 8080
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M'
    }
  ]
};
EOF
    log_success "PM2 configuration created: ecosystem.config.js"
}

# Show help
show_help() {
    echo "Usage: ./deploy.sh [command]"
    echo
    echo "Commands:"
    echo "  docker    Deploy using Docker (default)"
    echo "  local     Build for local/manual deployment"
    echo "  setup     Setup environment configuration only"
    echo "  pm2       Create PM2 configuration"
    echo "  help      Show this help message"
    echo
    echo "Examples:"
    echo "  ./deploy.sh docker    # Deploy with Docker"
    echo "  ./deploy.sh local     # Build without Docker"
    echo "  ./deploy.sh setup     # Generate .env files"
    echo
}

# Main
cd "$SCRIPT_DIR"

case "$DEPLOY_MODE" in
    docker)
        deploy_docker
        ;;
    local)
        deploy_local
        ;;
    setup)
        setup_env
        ;;
    pm2)
        create_pm2_config
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Unknown command: $DEPLOY_MODE"
        show_help
        exit 1
        ;;
esac
