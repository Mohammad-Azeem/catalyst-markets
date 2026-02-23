#!/bin/bash

echo "🚀 Catalyst Markets - Quick Setup Script"
echo "========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"

# Start Docker services
echo ""
echo "📦 Starting Docker services (PostgreSQL, Redis, Elasticsearch)..."
docker-compose up -d

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are healthy
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Docker services are running${NC}"
else
    echo -e "${RED}❌ Docker services failed to start${NC}"
    echo "Run 'docker-compose logs' to see what went wrong"
    exit 1
fi

# Setup backend
echo ""
echo "🔧 Setting up backend..."
cd backend

if [ ! -f .env.development ]; then
    echo "📝 Creating .env.development from template..."
    cp .env.example .env.development
    echo -e "${YELLOW}⚠️  Please edit backend/.env.development and add your API keys${NC}"
fi

echo "📦 Installing backend dependencies..."
npm install

echo "🗄️  Generating Prisma client..."
npx prisma generate

echo "🗄️  Running database migrations..."
npx prisma migrate dev --name init

echo "🌱 Seeding database..."
npx prisma db seed

cd ..

# Setup frontend
echo ""
echo "🎨 Setting up frontend..."
cd frontend

if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from template..."
    cp .env.example .env.local
fi

echo "📦 Installing frontend dependencies..."
npm install

cd ..

# Summary
echo ""
echo "========================================="
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "========================================="
echo ""
echo "📊 Database GUI:    http://localhost:8080"
echo "🔴 Redis GUI:       http://localhost:8081"
echo "🗄️  Prisma Studio:  npx prisma studio (in backend folder)"
echo ""
echo "To start development:"
echo "  ${GREEN}npm run dev${NC}  (starts both backend and frontend)"
echo ""
echo "Or start separately:"
echo "  Terminal 1: ${GREEN}cd backend && npm run dev${NC}"
echo "  Terminal 2: ${GREEN}cd frontend && npm run dev${NC}"
echo ""
echo -e "${YELLOW}⚠️  Next Steps:${NC}"
echo "1. Edit backend/.env.development with your API keys"
echo "2. Edit frontend/.env.local if needed"
echo "3. Run 'npm run dev' to start development"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
