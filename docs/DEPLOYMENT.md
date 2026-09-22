# Deployment Guide

This guide covers deploying Arena Africa to production environments.

## Prerequisites

### Required Services
- **PostgreSQL 14+** (managed service recommended: Supabase, Neon, AWS RDS)
- **Node.js 20+** runtime
- **Domain & SSL** certificate
- **Email service** (for notifications - future)

### Optional Services
- **Google Gemini API** (AI features degrade gracefully without it)
- **CDN** (Cloudflare, Vercel Edge)
- **Monitoring** (Sentry, Datadog, LogDNA)
- **Analytics** (Plausible, PostHog)

## Environment Setup

### 1. Clone & Install
```bash
git clone https://github.com/your-org/arena-africa.git
cd arena-africa
npm install
```

### 2. Configure Environment Variables

Create `.env.production` based on `.env.example`:

```bash
# Database (Required)
DATABASE_URL=postgresql://user:pass@host:5432/arena_prod

# Authentication (Required - MUST be secure in production)
AUTH_SECRET=$(openssl rand -base64 32)

# AI Features (Optional)
GEMINI_API_KEY=your_gemini_key_here
GEMINI_MODEL=gemini-2.0-flash-exp

# Application
NODE_ENV=production
```

**CRITICAL**: Never use the development `AUTH_SECRET` in production. Generate a cryptographically secure secret.

### 3. Database Setup

#### Provision Database
```bash
# Example: Supabase
# 1. Create project at supabase.com
# 2. Copy connection string from Settings > Database
# 3. Set DATABASE_URL in .env.production

# Example: Local PostgreSQL
createdb arena_prod
export DATABASE_URL=postgresql://postgres:password@localhost:5432/arena_prod
```

#### Apply Schema
```bash
# Push Drizzle schema
npm run db:push

# This runs:
# 1. drizzle-kit push --config=drizzle.config.json
# 2. psql $DATABASE_URL -f src/db/indexes.sql

# Verify indexes were applied
psql $DATABASE_URL -c "\d+ predictions"
```

**Indexes are critical for production performance.** The `db:push` script applies both schema and indexes atomically.

#### Seed Data (Optional)
The app auto-seeds on first data fetch via `ensureSeeded()`. For pre-seeding:

```bash
# Start the app once to trigger seeding
npm run build
npm run start &
curl http://localhost:3000/api/health
# Seeding happens on first page load
killall node
```

## Deployment Options

### Option A: Vercel (Recommended for Simplicity)

Vercel provides zero-config Next.js hosting with automatic HTTPS, CDN, and preview deployments.

#### 1. Install Vercel CLI
```bash
npm install -g vercel
```

#### 2. Configure Project
Create `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "framework": "nextjs",
  "env": {
    "DATABASE_URL": "@database-url",
    "AUTH_SECRET": "@auth-secret",
    "GEMINI_API_KEY": "@gemini-api-key"
  }
}
```

#### 3. Add Environment Secrets
```bash
vercel env add DATABASE_URL production
vercel env add AUTH_SECRET production
vercel env add GEMINI_API_KEY production
```

#### 4. Deploy
```bash
vercel --prod
```

**Post-Deployment:**
- Run `npm run db:push` manually (Vercel doesn't auto-run migrations)
- Set custom domain in Vercel dashboard
- Enable Vercel Analytics (optional)

### Option B: Docker (Self-Hosted)

For VPS, on-premises, or Kubernetes deployment.

#### 1. Create Dockerfile
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
```

#### 2. Build Image
```bash
docker build -t arena-africa:latest .
```

#### 3. Run Container
```bash
docker run -d \
  --name arena-africa \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e AUTH_SECRET="$(openssl rand -base64 32)" \
  -e NODE_ENV=production \
  arena-africa:latest
```

#### 4. Docker Compose (Recommended)
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - AUTH_SECRET=${AUTH_SECRET}
      - NODE_ENV=production
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=arena
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=arena_prod
    restart: unless-stopped

volumes:
  postgres_data:
```

Deploy:
```bash
docker-compose up -d
docker-compose exec app npm run db:push
```

### Option C: Traditional VPS (Ubuntu 22.04)

#### 1. Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Caddy (reverse proxy with auto-HTTPS)
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/caddy-stable-archive-keyring.gpg] https://dl.cloudsmith.io/public/caddy/stable/deb/debian any-version main" | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

#### 2. Create Application User
```bash
sudo useradd -m -s /bin/bash arena
sudo su - arena
```

#### 3. Deploy Application
```bash
# Clone repo
git clone https://github.com/your-org/arena-africa.git
cd arena-africa

# Install dependencies
npm ci --only=production

# Configure environment
cp .env.example .env.production
nano .env.production  # Set DATABASE_URL, AUTH_SECRET

# Build
npm run build

# Apply database schema
npm run db:push
```

#### 4. Setup PM2 Process Manager
```bash
npm install -g pm2

# Start app
pm2 start npm --name "arena-africa" -- start

# Save PM2 state
pm2 save

# Auto-start on reboot
pm2 startup
# Follow the command output instructions
```

#### 5. Configure Caddy Reverse Proxy
```bash
sudo nano /etc/caddy/Caddyfile
```

Add:
```caddyfile
arena.africa {
    reverse_proxy localhost:3000
    encode gzip

    # Security headers (Next.js proxy.ts also sets these)
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
}
```

Reload Caddy:
```bash
sudo systemctl reload caddy
```

Caddy automatically obtains and renews Let's Encrypt SSL certificates.

#### 6. Setup Firewall
```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

## Post-Deployment Checklist

### Security
- [ ] `AUTH_SECRET` is cryptographically random (min 32 chars)
- [ ] Database uses SSL/TLS (`?sslmode=require` in connection string)
- [ ] HTTPS is enforced (HTTP redirects to HTTPS)
- [ ] Security headers verified (check via securityheaders.com)
- [ ] Rate limiting tested (should block after 60 GET / 20 POST per minute)
- [ ] CORS configured if serving API to external domains

### Database
- [ ] Indexes applied (`npm run db:push` completed successfully)
- [ ] CHECK constraints active (verify via `psql \d+ predictions`)
- [ ] Connection pooling configured (Drizzle default: 1 connection, increase for scale)
- [ ] Backups configured (automated daily snapshots)

### Performance
- [ ] Next.js build completed without warnings
- [ ] Static assets served via CDN (if using Vercel/Cloudflare)
- [ ] Images optimized (Next.js Image component used throughout)
- [ ] Database queries indexed (no sequential scans on large tables)

### Monitoring
- [ ] Uptime monitoring configured (UptimeRobot, Pingdom)
- [ ] Error tracking enabled (Sentry integration - future)
- [ ] Log aggregation setup (CloudWatch, Datadog)
- [ ] Health check endpoint responding: `GET /api/health`

### Testing
- [ ] Run production build locally: `npm run build && npm start`
- [ ] Test auth flow (login, token validation, logout)
- [ ] Place test prediction (verify policy engine enforces limits)
- [ ] Test rate limiting (should 429 after threshold)
- [ ] Verify USSD simulator loads
- [ ] Check mobile PWA manifest loads (`/manifest.json`)

## Scaling Considerations

### Database Optimization
```sql
-- Monitor slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Add connection pooling (via PgBouncer)
# Install PgBouncer and point DATABASE_URL to it
# Example: DATABASE_URL=postgresql://user:pass@pgbouncer:6432/arena_prod
```

### Application Scaling
- **Horizontal**: Deploy multiple Next.js instances behind a load balancer
- **Vertical**: Increase Node.js memory: `NODE_OPTIONS=--max-old-space-size=4096`
- **Edge**: Use Vercel Edge Functions for `/api/health` and static endpoints

### Caching Strategy
```typescript
// Future: Add Redis for policy decisions, exchange rates
// Current: In-memory rate limiting (per-instance, not shared)
```

## Rollback Procedure

If deployment fails:

```bash
# Docker
docker-compose down
docker-compose up -d <previous-version-tag>

# PM2
pm2 stop arena-africa
cd arena-africa
git checkout <previous-commit>
npm ci --only=production
npm run build
pm2 restart arena-africa

# Database rollback (if schema changed)
# Restore from backup before running npm run db:push
pg_restore -d arena_prod backup_before_deploy.dump
```

## CI/CD Pipeline (GitHub Actions Example)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## Monitoring Endpoints

After deployment, monitor these URLs:

- **Health**: `https://arena.africa/api/health` (should return 200)
- **Database**: `https://arena.africa/api/markets` (should list markets)
- **Auth**: `https://arena.africa/api/auth/login` (POST, should return token)

## Troubleshooting

### Database Connection Fails
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check if indexes applied
psql $DATABASE_URL -c "\d+ predictions"
```

### Build Fails
```bash
# Clear Next.js cache
rm -rf .next
npm run build

# Check Node version
node --version  # Should be 20+
```

### Rate Limiting Not Working
```bash
# Verify proxy.ts is running
curl -I https://arena.africa/api/health

# Should include rate-limiting headers
# Check logs for rate limit hits
```

## Support

- **Deployment Issues**: deployment@arena.africa
- **Security Concerns**: security@arena.africa
- **Documentation**: https://docs.arena.africa

---

**Last Updated**: 2026-09-16
**Deployment Version**: 1.0.0
