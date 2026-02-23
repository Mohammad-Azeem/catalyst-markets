# 🚀 Catalyst Markets - Setup Instructions

## Project Structure Created

```
catalyst-markets/
├── backend/
│   ├── src/
│   │   ├── config/           # Configuration management
│   │   ├── db/               # Prisma & Redis clients
│   │   ├── utils/            # Logger and utilities
│   │   └── server.ts         # Express server
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── seed.ts           # Seed data
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/
│   ├── src/                  # Next.js app (to be created)
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── .env.example
├── docker-compose.yml
└── package.json
```

## 📦 Step 1: Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## 🐳 Step 2: Start Docker Services

```bash
# From project root
docker-compose up -d

# Verify services are running
docker-compose ps

# You should see:
# - catalyst-postgres (port 5432)
# - catalyst-redis (port 6379)
# - catalyst-elasticsearch (port 9200)
# - catalyst-adminer (port 8080) - Database GUI
# - catalyst-redis-commander (port 8081) - Redis GUI
```

## 🗄️ Step 3: Setup Database

```bash
cd backend

# Copy environment file
cp .env.example .env.development

# Edit .env.development and update:
# - DATABASE_URL (should already be correct for local Docker)
# - REDIS_URL (should already be correct for local Docker)
# - Add your API keys (NSE, IEX Cloud, OpenAI, etc.)

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed initial data (stocks, IPOs, etc.)
npx prisma db seed

# (Optional) Open Prisma Studio to view data
npx prisma studio
# Opens at http://localhost:5555
```

## 🎨 Step 4: Setup Frontend

```bash
cd frontend

# Copy environment file
cp .env.example .env.local

# Edit .env.local and update:
# - NEXT_PUBLIC_API_URL (http://localhost:3001/api/v1)
# - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (if using Clerk)
```

## 🚀 Step 5: Start Development Servers

### Option A: Start Everything at Once

```bash
# From project root
npm run dev

# This starts:
# - Backend API (http://localhost:3001)
# - Frontend (http://localhost:3000)
```

### Option B: Start Services Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## ✅ Step 6: Verify Installation

### Backend Health Check
Open http://localhost:3001/health

You should see:
```json
{
  "status": "ok",
  "checks": {
    "database": "healthy",
    "redis": "healthy"
  }
}
```

### Frontend
Open http://localhost:3000

### Database GUI
- **Adminer:** http://localhost:8080
  - System: PostgreSQL
  - Server: postgres
  - Username: catalyst_user
  - Password: dev_password_123
  - Database: catalyst_dev

### Redis GUI
- **Redis Commander:** http://localhost:8081

## 🔑 Getting API Keys (Required for Full Functionality)

### 1. IEX Cloud (Free Tier - US Markets)
1. Sign up at https://iexcloud.io/
2. Get your API token from dashboard
3. Add to `backend/.env.development`:
   ```
   IEX_CLOUD_API_KEY=pk_xxxxxxxxxxxxxxxxxxxxx
   ```

### 2. Alpha Vantage (Free Tier - Global Markets)
1. Sign up at https://www.alphavantage.co/
2. Get your API key
3. Add to `backend/.env.development`:
   ```
   ALPHA_VANTAGE_API_KEY=your_key_here
   ```

### 3. OpenAI (for IPO Advisor)
1. Sign up at https://platform.openai.com/
2. Create API key
3. Add to `backend/.env.development`:
   ```
   OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
   ```

### 4. NSE Data (Optional - India Markets)
- **Free Option:** Use delayed data via Alpha Vantage
- **Paid Option:** Apply for NSE data feed license
  - Visit: https://www.nseindia.com/market-data

### 5. Clerk (Authentication)
1. Sign up at https://clerk.com/
2. Create application
3. Copy keys to both frontend and backend `.env` files

## 🧪 Testing the Setup

### Test Backend
```bash
cd backend

# Run tests
npm test

# Check linting
npm run lint

# Type checking
npm run typecheck
```

### Test Frontend
```bash
cd frontend

# Run tests (once created)
npm test

# Check linting
npm run lint

# Type checking
npm run typecheck
```

## 📝 Next Steps

Now that the foundation is ready, we'll build:

1. **Week 1-2:**
   - Stock price fetching services
   - IPO scraper for GMP data
   - REST API endpoints
   - Basic frontend components

2. **Week 3-4:**
   - IPO Advisor logic
   - Fear & Greed calculator
   - Momentum screener
   - Real-time WebSocket updates

3. **Week 5-6:**
   - Complete frontend UI
   - Authentication flow
   - Testing & bug fixes
   - MVP launch

## 🐛 Troubleshooting

### Database Connection Failed
```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart PostgreSQL
docker-compose restart postgres

# View logs
docker-compose logs postgres
```

### Redis Connection Failed
```bash
# Check if Redis is running
docker-compose ps

# Restart Redis
docker-compose restart redis

# Test connection
docker exec -it catalyst-redis redis-cli ping
# Should return: PONG
```

### Port Already in Use
```bash
# Backend (port 3001)
lsof -ti:3001 | xargs kill -9

# Frontend (port 3000)
lsof -ti:3000 | xargs kill -9
```

### Prisma Issues
```bash
# Reset Prisma client
rm -rf node_modules/.prisma
npx prisma generate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## 📚 Useful Commands

```bash
# View all logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v

# Run Prisma Studio
cd backend && npx prisma studio

# Format all code
npm run format

# Check bundle size
cd frontend && npm run analyze
```

## 🆘 Getting Help

If you encounter any issues:
1. Check the logs: `docker-compose logs`
2. Verify environment variables are set correctly
3. Ensure all dependencies are installed
4. Check if ports 3000, 3001, 5432, 6379 are available

---

**✅ Setup Complete! Ready to start building features.**

Next: Ask me which feature you want to build first:
- Stock price fetching
- IPO scraper
- API endpoints
- Frontend components
