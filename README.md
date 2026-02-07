# 🚀 Catalyst: Global Markets
📈 Your AI-powered gateway to global markets. Track NSE/NASDAQ stocks, decode IPOs with GMP insights, and discover momentum trades—all in one platform. Built for Indian retail investors going global.



> **A unified cross-market stock & IPO intelligence platform for retail investors**

Track real-time stock prices across NSE, NASDAQ, NYSE, and European exchanges. Get AI-powered IPO insights with GMP tracking, subscription data, and investment recommendations. Discover momentum trading opportunities with built-in screeners and market sentiment analysis.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![Python Version](https://img.shields.io/badge/python-%3E%3D3.11-blue)](https://python.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Environment Variables](#-environment-variables)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)

---

## ✨ Features

### 🇮🇳 Indian Market Intelligence
- **Real-Time NSE Pricing** - Track 500+ stocks with 15-second updates
- **IPO Dashboard** - Comprehensive IPO calendar with subscription tracking
- **GMP Insights** - Live Grey Market Premium data and allotment probability
- **DRHP Analysis** - AI-powered financial statement extraction
- **Apply/Not Advisor** - ML-driven IPO investment recommendations
- **Fear & Greed Gauge** - Daily market sentiment scoring (India VIX, FII flows)

### 🌎 Global Market Access
- **Multi-Exchange Support** - NASDAQ, NYSE, LSE, Euronext
- **Currency Conversion** - Real-time USD/EUR/GBP to INR
- **Cross-Market Comparison** - Compare stocks across geographies

### 📊 Trading Tools
- **Momentum Screener** - Identify short-term trading opportunities
- **Portfolio Tracker** - Track P&L across multiple markets
- **Price Alerts** - Real-time notifications via email/SMS
- **Watchlists** - Organize up to 50 stocks per list

### 🤖 AI-Powered Insights
- **Investment Thesis Generator** - Bull/bear case analysis for any stock
- **Historical Pattern Recognition** - "This stock fell 40% in 2020 but recovered 120%"
- **Strategy Backtesting** - Test momentum strategies on historical data

---

## 🛠 Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router, React 18)
- **Styling:** Tailwind CSS, shadcn/ui components
- **State Management:** Zustand
- **Charts:** Recharts, TradingView Lightweight Charts
- **Auth:** Clerk
- **Deployment:** Vercel

### Backend
- **API Layer:** Node.js (Express) + Python (FastAPI)
- **Database:** PostgreSQL 15 (Prisma ORM)
- **Cache:** Redis 7
- **Search:** Elasticsearch 8
- **Task Queue:** Celery + Redis
- **WebSocket:** Socket.io
- **Deployment:** Docker + AWS ECS (Fargate)

### Infrastructure
- **Cloud:** AWS (RDS, ElastiCache, ECS, S3, CloudFront)
- **CDN:** Cloudflare
- **Monitoring:** Datadog, Sentry
- **CI/CD:** GitHub Actions
- **IaC:** Terraform

### External APIs
- **Market Data:** NSE Official API, IEX Cloud, Alpha Vantage
- **AI/ML:** OpenAI GPT-4, Anthropic Claude
- **Notifications:** SendGrid (email), Twilio (SMS)

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:
```bash
# Required
- Node.js 18+ (use nvm: nvm install 18)
- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose

# Optional (for development)
- AWS CLI (for deployment)
- Terraform (for infrastructure)
```

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/catalyst-markets.git
cd catalyst-markets
```

### 2. Start Infrastructure (Docker Compose)
```bash
# Start PostgreSQL, Redis, Elasticsearch
docker-compose up -d

# Verify services are running
docker-compose ps
```

### 3. Setup Backend
```bash
cd backend

# Install Node.js dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env.development

# Edit .env.development with your API keys
nano .env.development

# Run database migrations
npx prisma migrate dev

# Seed initial data
npx prisma db seed

# Start backend services
npm run dev          # Node.js API (port 3001)
python -m uvicorn python_services.main:app --reload --port 8000  # FastAPI (port 8000)
celery -A python_services.tasks worker --loglevel=info  # Background workers
```

### 4. Setup Frontend
```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Edit .env.local
nano .env.local

# Start development server
npm run dev  # Runs on http://localhost:3000
```

### 5. Access the Application

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Default Test User:**
- Email: `demo@catalystmarkets.com`
- Password: `Demo@123` (if using Clerk dev mode)

---

## 📁 Project Structure
```
catalyst-markets/
├── backend/
│   ├── src/
│   │   ├── routes/          # Express route handlers
│   │   ├── controllers/     # Business logic
│   │   ├── middleware/      # Auth, rate limiting, validation
│   │   ├── services/        # External API integrations
│   │   ├── db/              # Prisma client, queries
│   │   ├── utils/           # Helper functions
│   │   └── server.ts        # Express app entry point
│   ├── python_services/
│   │   ├── tasks/           # Celery tasks (GMP scraper, DRHP parser)
│   │   ├── ml/              # ML models (IPO advisor)
│   │   ├── scrapers/        # Web scrapers
│   │   └── main.py          # FastAPI entry point
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   ├── migrations/      # Migration history
│   │   └── seed.ts          # Seed data script
│   ├── tests/               # Unit & integration tests
│   ├── Dockerfile.api
│   ├── Dockerfile.fastapi
│   ├── Dockerfile.celery
│   ├── package.json
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js app router pages
│   │   │   ├── (dashboard)/ # Dashboard layout group
│   │   │   ├── ipo/         # IPO pages
│   │   │   ├── stocks/      # Stock pages
│   │   │   └── portfolio/   # Portfolio pages
│   │   ├── components/      # React components
│   │   │   ├── ui/          # shadcn/ui components
│   │   │   ├── charts/      # Chart components
│   │   │   ├── ipo/         # IPO-specific components
│   │   │   └── stocks/      # Stock-specific components
│   │   ├── lib/             # Utility functions
│   │   ├── hooks/           # Custom React hooks
│   │   ├── store/           # Zustand state management
│   │   └── types/           # TypeScript types
│   ├── public/              # Static assets
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── infrastructure/
│   ├── terraform/
│   │   ├── modules/         # Reusable Terraform modules
│   │   ├── environments/
│   │   │   ├── dev/
│   │   │   ├── staging/
│   │   │   └── production/
│   │   └── main.tf
│   └── scripts/
│       ├── deploy.sh
│       └── backup-db.sh
│
├── docs/
│   ├── API.md               # API documentation
│   ├── DEPLOYMENT.md        # Deployment guide
│   ├── CONTRIBUTING.md      # Contribution guidelines
│   └── ARCHITECTURE.md      # System architecture
│
├── .github/
│   ├── workflows/
│   │   ├── deploy.yml       # CI/CD pipeline
│   │   └── test.yml         # Test automation
│   └── PULL_REQUEST_TEMPLATE.md
│
├── docker-compose.yml       # Local development services
├── .env.example             # Environment variables template
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🔐 Environment Variables

### Backend (.env.development)
```bash
# Database
DATABASE_URL=postgresql://catalyst_user:dev_password_123@localhost:5432/catalyst_dev
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL=redis://localhost:6379/0

# API Keys
NSE_API_KEY=your_nse_api_key
NSE_API_SECRET=your_nse_api_secret
IEX_CLOUD_API_KEY=your_iex_cloud_key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx

# Auth
JWT_SECRET=your_jwt_secret_min_32_characters
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxx

# AWS (for S3)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=catalyst-drhp-documents
AWS_REGION=ap-south-1

# External Services
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxx
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_token

# Feature Flags
ENABLE_US_MARKETS=true
ENABLE_EU_MARKETS=false
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxx

# Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# Feature Flags
NEXT_PUBLIC_ENABLE_PRO_TIER=false
```

**📝 Note:** Copy `.env.example` to `.env.development` and fill in your actual values. Never commit `.env` files to version control.

---

## 💻 Development

### Running Backend Services
```bash
# Terminal 1: Node.js API
cd backend
npm run dev  # Runs on http://localhost:3001

# Terminal 2: Python FastAPI
cd backend
python -m uvicorn python_services.main:app --reload --port 8000

# Terminal 3: Celery Worker (background tasks)
cd backend
celery -A python_services.tasks worker --loglevel=info

# Terminal 4: Celery Beat (scheduled tasks)
celery -A python_services.tasks beat --loglevel=info
```

### Running Frontend
```bash
cd frontend
npm run dev  # Runs on http://localhost:3000
```

### Database Commands
```bash
# Create a new migration
npx prisma migrate dev --name add_new_feature

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Open Prisma Studio (database GUI)
npx prisma studio  # Opens at http://localhost:5555

# Generate Prisma Client (after schema changes)
npx prisma generate
```

### Useful Scripts
```bash
# Backend
npm run build        # Build for production
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run typecheck    # Run TypeScript compiler

# Frontend
npm run build        # Build Next.js app
npm run start        # Start production server
npm run lint         # Run ESLint
npm run analyze      # Bundle size analysis
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- src/services/ipoAdvisor.test.ts

# Run integration tests
npm run test:integration
```

### Frontend Tests
```bash
cd frontend

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests (Playwright)
npm run test:e2e

# Run E2E in UI mode
npm run test:e2e:ui
```

### Load Testing
```bash
# Install k6
brew install k6  # macOS
# OR: https://k6.io/docs/getting-started/installation/

# Run load test
k6 run tests/load/api-load-test.js
```

---

## 🚢 Deployment

### Prerequisites
```bash
# Install AWS CLI
brew install awscli  # macOS
aws configure

# Install Terraform
brew install terraform
```

### Deploy to Production
```bash
# 1. Build Docker images
cd backend
docker build -f Dockerfile.api -t catalyst-backend:latest .

# 2. Push to ECR
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com
docker tag catalyst-backend:latest ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/catalyst-backend:latest
docker push ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/catalyst-backend:latest

# 3. Deploy infrastructure
cd infrastructure/terraform
terraform init
terraform apply -var-file="production.tfvars"

# 4. Deploy frontend to Vercel
cd frontend
vercel --prod
```

**Automated Deployment:** Push to `main` branch triggers GitHub Actions CI/CD pipeline.

---

## 📚 API Documentation

### Base URL
```
Development: http://localhost:3001/api
Production:  https://api.catalystmarkets.com/api
```

### Authentication

All protected endpoints require a JWT token:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" https://api.catalystmarkets.com/api/portfolio
```

### Example Endpoints

#### Get IPO List
```bash
GET /api/ipos?status=open&page=1&limit=20

Response:
{
  "data": [
    {
      "id": 1,
      "companyName": "TechCorp India",
      "openDate": "2026-03-01",
      "closeDate": "2026-03-03",
      "gmpPercent": 25.5,
      "totalSubscription": 12.3
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### Get Stock Price
```bash
GET /api/stocks/RELIANCE?exchange=NSE

Response:
{
  "symbol": "RELIANCE",
  "name": "Reliance Industries",
  "currentPrice": 2450.75,
  "dayChange": 12.30,
  "dayChangePercent": 0.50,
  "volume": 8543210,
  "lastUpdated": "2026-02-07T15:29:45Z"
}
```

#### IPO Advisor
```bash
POST /api/ipos/123/advisor

Response:
{
  "verdict": "APPLY",
  "score": 8,
  "confidence": 0.85,
  "reasons": [
    "Strong GMP of 28%",
    "QIB subscription 5.2x",
    "3-year revenue CAGR: 34%"
  ],
  "risks": [
    "High debt-to-equity ratio (1.8)",
    "Concentrated customer base"
  ]
}
```

**Full API Documentation:** See [docs/API.md](docs/API.md)

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](docs/CONTRIBUTING.md).

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**
```bash
   git checkout -b feature/amazing-feature
```
3. **Make your changes**
4. **Run tests**
```bash
   npm test
```
5. **Commit with conventional commits**
```bash
   git commit -m "feat: add IPO allotment predictor"
```
6. **Push and create a Pull Request**

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):
```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

### Documentation
- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Architecture Overview](docs/ARCHITECTURE.md)

### Get Help
- **GitHub Issues:** [Report bugs or request features](https://github.com/your-org/catalyst-markets/issues)
- **Discussions:** [Ask questions](https://github.com/your-org/catalyst-markets/discussions)
- **Email:** support@catalystmarkets.com

### Security
Found a security vulnerability? Please email security@catalystmarkets.com instead of using the issue tracker.

---

## 🙏 Acknowledgments

- **Data Providers:** NSE, IEX Cloud, Alpha Vantage
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Inspiration:** TradingView, Zerodha, Groww

---

## 📊 Project Status

- ✅ MVP Complete (Months 1-2)
- 🚧 v1 in Development (Months 3-4)
- 📅 v2 Planned (Months 5-6)

**Current Version:** v0.1.0-beta

---

## 🗺 Roadmap

### v1.0 (March 2026)
- [ ] US & EU market expansion
- [ ] Portfolio tracker with P&L
- [ ] IPO allotment predictor
- [ ] DRHP financial deep-dive

### v2.0 (May 2026)
- [ ] AI-powered investment thesis
- [ ] Options chain analysis
- [ ] Short-term gain strategies
- [ ] Pro tier monetization

See [GitHub Projects](https://github.com/your-org/catalyst-markets/projects) for detailed milestones.

---

**Built with ❤️ by the Catalyst Team**

[Website](https://catalystmarkets.com) • [Twitter](https://twitter.com/catalystmarkets) • [LinkedIn](https://linkedin.com/company/catalystmarkets)
