# AI-Powered IT & Telecom Project & Program Management Platform

A production-ready enterprise web application for managing IT Infrastructure, Telecom Network Rollouts (4G/5G/Fiber), OSS/BSS Implementations, Data Center Deployments, and Cloud Migration Programs — powered by an AI Copilot using Anthropic Claude.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, TailwindCSS |
| Backend | NestJS, TypeScript, Prisma ORM |
| Database | PostgreSQL 15, Redis 7 |
| AI | Anthropic Claude (claude-sonnet-4-6) |
| Storage | MinIO (S3-compatible) |
| Auth | JWT (access + refresh tokens), Passport.js |
| Deployment | Docker, Docker Compose |

---

## Project Structure

```
ai-ppm-platform/
├── backend/        # NestJS REST API
├── frontend/       # Next.js web application
├── database/       # SQL schema and seed files
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- An Anthropic API key

### 1. Clone and configure environment
```bash
cp .env.example .env
# Edit .env and fill in your ANTHROPIC_API_KEY and other values
```

### 2. Start all services with Docker
```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- MinIO on port 9000 (console at 9001)
- NestJS API on port 3001
- Next.js frontend on port 3000

### 3. Run database migrations and seed
```bash
# Wait for postgres to be healthy, then:
docker-compose exec api npx prisma migrate deploy
docker-compose exec api npx prisma db seed
```

### 4. Access the application
- **Frontend:** http://localhost:3000
- **API Swagger:** http://localhost:3001/api/docs
- **MinIO Console:** http://localhost:9001

### Default Login Credentials (seed data)
| Role | Email | Password |
|---|---|---|
| Super Admin | admin@acme-telecom.com | Admin@123 |
| Program Manager | pm@acme-telecom.com | Password@123 |
| Project Manager | pjm@acme-telecom.com | Password@123 |
| Finance | finance@acme-telecom.com | Password@123 |
| Client Viewer | client@acme-telecom.com | Password@123 |

---

## Development Setup (without Docker)

### Backend
```bash
cd backend
npm install
cp ../.env.example .env
# Update DATABASE_URL to point to your local PostgreSQL
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Core Modules

| Module | Description |
|---|---|
| Portfolio Management | Strategic portfolio tracking, budget allocation, health dashboards |
| Program Management | Cross-project dependency mapping, program-level RAID |
| Project Management | WBS, Kanban, Gantt, milestones, change requests, RAID log |
| Resource Management | Resource pool, capacity planning, utilization tracking |
| Financial Management | CAPEX/OPEX, EVM (CPI/SPI/EAC/ETC), vendor invoice tracking |
| Risk & Issue Management | Risk register, probability-impact matrix, escalation workflows |
| Dashboards & Reporting | Portfolio, program, project, executive, and client dashboards |
| Document Management | Version-controlled document repository with AI summarization |
| AI Copilot | Context-aware AI assistant across all modules |

---

## AI Copilot Capabilities

- **Status Report Generation** — Auto-generate project status reports
- **Risk Analysis** — AI risk scoring and mitigation recommendations
- **Executive Summary** — Program-level executive summaries
- **Natural Language Queries** — "Why is Project X delayed?"
- **Meeting Minutes Summarization** — Paste meeting notes, get structured minutes
- **Cost Anomaly Detection** — Flag unusual budget variances
- **Stakeholder Email Drafting** — Generate professional stakeholder communications

---

## Role-Based Access Control

| Role | Capabilities |
|---|---|
| Super Admin | Full system access |
| Portfolio Manager | All portfolios and programs |
| Program Manager | Assigned programs and their projects |
| Project Manager | Assigned projects |
| PMO | Read all, create reports |
| Finance | Financial data across all projects |
| Resource Manager | Resource pool management |
| Client Viewer | Read-only client dashboard |

---

## Telecom-Specific Features

- 5G rollout project templates
- Fiber deployment project templates
- Site readiness tracking
- Permit tracking workflow
- Vendor onboarding management
- Equipment delivery tracking

---

## API Documentation

Swagger UI is available at `http://localhost:3001/api/docs` when running.

---

## Marked for Future Implementation

- AI autonomous project manager
- Monte Carlo schedule simulation
- Predictive vendor performance scoring
- Integration with Primavera / MS Project
- Real-time IoT network rollout tracking
- Blockchain-based contract validation
- Advanced scenario planning engine
- NLP-based contract risk scoring
- Automated PMO compliance audit engine

---

## Environment Variables

See `.env.example` for all required configuration values.

---

## License

Proprietary — Enterprise use only.
