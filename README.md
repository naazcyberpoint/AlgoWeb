# AlgoWeb - Enterprise Algorithmic Trading Platform Monorepo

Production-grade, high-throughput algorithmic trading platform monorepo scaffold built for multi-asset execution, vectorized backtesting, real-time market data streaming, and quantitative strategy automation.

---

## 🏗 System Architecture & Monorepo Layout

```
.
├── .github/              # CI/CD Workflows (GitHub Actions)
│   ├── workflows/        # Automated Linting, Testing & Security Scans
│   └── PULL_REQUEST_TEMPLATE.md
├── frontend/             # Next.js 15 (App Router, TS, Tailwind, shadcn/ui)
│   ├── src/
│   │   ├── app/          # Routes, Layouts, App Router structure
│   │   ├── components/   # UI components, Charts, Strategy Widgets
│   │   ├── hooks/        # WebSocket & Market Data custom hooks
│   │   ├── services/     # API Client & Gateway
│   │   └── store/        # State Management (Zustand)
│   └── package.json
├── backend/              # FastAPI Python Microservice Application
│   ├── app/
│   │   ├── api/          # V1 REST Endpoints & Routers
│   │   ├── core/         # Pydantic Settings, JWT, Security, Database
│   │   ├── db/           # Repositories & Data Access Objects
│   │   ├── schemas/      # Pydantic Data Validation Schemas
│   │   ├── services/     # Business Domain Logic
│   │   └── websockets/   # Real-time WebSocket Connection Manager
│   ├── main.py
│   └── Dockerfile
├── packages/             # Shared Monorepo Packages
│   ├── types/            # Common TypeScript Interfaces & DTOs
│   └── ui/               # Shared UI Components
├── shared/               # Cross-Language Contracts
│   ├── schemas/          # JSON Schemas for Order & Strategy Specs
│   ├── openapi.json      # OpenAPI API Specification
│   └── constants.json    # Global Trading System Constants
├── docs/                 # Architecture, SRS, API & Database Documentation
│   ├── ARCHITECTURE.md
│   ├── API_SPECIFICATION.md
│   └── DATABASE_SCHEMA.md
├── docker/               # Docker Engine Container Specifications
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── Dockerfile.worker
├── scripts/              # Development, Database Seeding & CI Scripts
├── docker-compose.yml    # Local Development Container Stack
├── pnpm-workspace.yaml   # Monorepo Workspace Configuration
├── pyproject.toml        # Python Tooling (Ruff, Pytest, MyPy)
├── requirements.txt      # Root Backend Python Dependencies
├── vercel.json           # Vercel Deployment Configuration
├── railway.json          # Railway Platform Deployment Spec
└── .env.example          # Master Environment Template
```

---

## 🚀 Tech Stack Specifications

### Frontend
- **Framework**: Next.js 15 (React 19, App Router)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS v4 + shadcn/ui primitives
- **State & Data**: Zustand (Global Store) + TanStack React Query v5
- **Icons & Motion**: Lucide React + Framer Motion

### Backend
- **Framework**: FastAPI (Python 3.12+)
- **Validation**: Pydantic v2 + Pydantic Settings
- **Async DB & Storage**: MongoDB Atlas (Async Motor Driver) + Redis Pub/Sub
- **ORM / Relational Support**: SQLAlchemy + Asyncpg (Future/Relational)
- **Task Queue**: Celery with Redis broker for backtests
- **Authentication**: JWT Bearer Tokens with Argon2 / Bcrypt hashing & AES-256 key vault

---

## 💻 Local Quickstart & Development

### Prerequisites
- Node.js >= 20.x
- PNPM >= 9.x
- Python >= 3.12
- Docker & Docker Compose

### 1. Environment Setup
Copy the environment template:
```bash
cp .env.example .env
```

### 2. Install Monorepo Dependencies
```bash
# Frontend & JS Packages
pnpm install

# Backend Python Dependencies
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Run Docker Stack (MongoDB + Redis)
```bash
docker-compose up -d mongo redis
```

### 4. Start Services
```bash
# Start FastAPI Backend
cd backend && uvicorn app.main:app --reload --port 8000

# Start Next.js Frontend
cd frontend && pnpm dev
```

---

## 🛡 Security & Design Rules
- **Zero Business Logic**: This scaffold contains configuration, schemas, and architecture contracts without fake mock execution code.
- **Strict Environment Isolations**: API keys and database credentials are strictly injected via runtime environment variables.
