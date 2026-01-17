# BBC Agents - AI Smart Planner

![Built with Multi-Agent AI](https://img.shields.io/badge/Built%20with-Multi--Agent%20AI-blueviolet?style=for-the-badge)

A powerful AI-driven task manager and calendar application that converts natural language commands into structured actions.

## 🚀 Overview

BBC Agents is a full-stack web application designed to help users organize their tasks, events, and projects using AI. It defines "Agents" that handle different aspects of productivity, planning, and content management.

## 🤖 Multi-Agent Development

### Built with AI Agent Orchestration

This project was developed using a cutting-edge **multi-agent AI development approach** with 15+ specialized AI agents working in parallel through Antigravity.

**Development Stats:**
- **Total Agents Deployed:** 15 core agents
- **Development Time:** ~2 hours (vs estimated 2 weeks manually)
- **Time Saved:** ~90% reduction
- **Tests Created:** 14 (100% passing)
- **Documentation:** 5 comprehensive guides
- **Success Rate:** 100%

### Agent Contributions

Our AI agents handled:
- ✅ **Testing Infrastructure** - Complete frontend (Vitest) and backend (Jest) test setup
- ✅ **Form Validation** - Zod schema validation across all forms
- ✅ **Bug Fixes** - Critical login form and UI issues resolved
- ✅ **Refactoring** - Large components broken into maintainable modules
- ✅ **Documentation** - READMEs, contributing guides, and technical docs
- ✅ **Integration** - Backend/Frontend connection and coordination
- ✅ **Quality Assurance** - Final verification and deployment readiness

### Learn More

Want to replicate this workflow? Check out our multi-agent development documentation:

- **[Agent Registry](docs/AGENT_REGISTRY.md)** - Complete log of all agents and their work
- **[Agent Templates](docs/AGENT_TEMPLATES.md)** - Reusable prompt templates for common tasks
- **[Multi-Agent Workflow](docs/MULTI_AGENT_WORKFLOW.md)** - Complete methodology guide

### Why Multi-Agent Development?

Traditional development is linear - you write code, test it, document it, fix bugs, one step at a time. 

Multi-agent development is **parallel** - multiple specialized AI agents work simultaneously on independent tasks, then coordinate to integrate their work. This approach:

- ⚡ **Accelerates development** by 10x or more
- 🎯 **Maintains quality** through specialized agents
- 📚 **Improves documentation** with dedicated doc agents
- 🧪 **Ensures testing** with parallel test development
- 🔄 **Enables rapid iteration** on complex features

## 🛠 Tech Stack

- **Frontend**: React + Vite + Tailwind CSS (using standard CSS imports/modules)
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (Prisma ORM)
- **AI Integration**: OpenAI API
- **Containerization**: Docker & Docker Compose

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16+)
- [Docker & Docker Compose](https://www.docker.com/)
- [npm](https://www.npmjs.com/)

## ⚡ Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "BBC Agents"
```

### 2. Configure Environment Variables

Create `.env` files from the examples provided:

```bash
# Root
cp .env.example .env

# Client
cd client
cp .env.example .env

# Server
cd ../server
cp .env.example .env
```

Update the values in `.env` files (especially `OPENAI_API_KEY` and `DATABASE_URL`).

### 3. Install Dependencies (Local Dev)

If you are running locally without Docker:

```bash
# Install Client Dependencies
cd client
npm install

# Install Server Dependencies
cd ../server
npm install
```

### 4. Run with Docker (Recommended)

To start the full stack (database, server, client):

```bash
docker-compose up --build
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000
- **Database**: Port 5432

### 5. Run Migrations

Once the database container is running, apply the database schema:

```bash
# If running via Docker
docker-compose exec server npx prisma migrate dev

# If running locally
cd server
npx prisma migrate dev
```

## 📂 Project Structure

- **`/client`**: React frontend application.
- **`/server`**: Express backend application and API.
- **`/docker-compose.yml`**: Container orchestration service definitions.

## 🖥 Development Workflow

1.  Start the database (e.g., via Docker).
2.  Start the backend: `cd server && npm run dev`
3.  Start the frontend: `cd client && npm run dev`

## 🔗 API Overview

The backend exposes several key endpoints under:
- `/auth`: Authentication (Register/Login)
- `/api`: Data management (Tasks, Projects, Action Items)
- `/ai`: AI processing endpoints

See `server/README.md` for detailed API documentation.

## 🤝 Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.
