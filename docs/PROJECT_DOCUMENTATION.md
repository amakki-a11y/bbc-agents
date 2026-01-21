# BBC Agents - Complete Project Documentation
## AI-Powered Company Operating System

---

# PART 1: PROJECT OVERVIEW

## What Is BBC Agents?

BBC Agents is an **AI-powered HR and Employee Management System** that goes beyond traditional management tools. It's designed to be a "Company Operating System" where an AI assistant helps manage employees, projects, tasks, documents, and communications with intelligent automation.

### Core Philosophy
- **AI-First**: Every feature is enhanced by AI capabilities
- **Self-Aware AI**: The system logs its own decisions for transparency and debugging
- **Hierarchy-Aware**: Respects organizational structure in all operations
- **Real-Time**: Live updates and proactive monitoring

---

## Technical Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 + Vite | Modern, fast UI |
| **Styling** | Tailwind CSS | Utility-first styling |
| **State Management** | React Context | Auth, global state |
| **Backend** | Node.js + Express | REST API server |
| **Database ORM** | Prisma | Type-safe database queries |
| **Database** | PostgreSQL | Production database (Railway) |
| **AI Provider** | Google Gemini API | AI capabilities |
| **Deployment** | Railway | Auto-deploy from GitHub |
| **Version Control** | GitHub | Source code management |

---

## URLs & Access

| Resource | URL |
|----------|-----|
| **GitHub Repo** | https://github.com/amakki-a11y/bbc-agents |
| **Frontend (Live)** | https://front-end-production-ad4c.up.railway.app |
| **Backend (Live)** | https://back-end-production-bad8.up.railway.app |
| **Local Path** | C:\Users\ABBASS\Desktop\BBC Agents |

### Login Credentials
```
Email: amakki@bbcorp.trade
Password: Admin123!
```

---

# PART 2: COMPLETE FEATURE LIST

## 🔐 Authentication & Authorization

### Features
- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Token refresh mechanism
- Session management

### Roles
| Role | Access Level |
|------|--------------|
| `SUPER_ADMIN` | Full system access |
| `ADMIN` | Company-wide management |
| `HR` | Employee management, hiring |
| `MANAGER` | Team management |
| `EMPLOYEE` | Self-service only |

### Key Files
```
server/src/controllers/auth.controller.js
server/src/middleware/auth.js
server/src/middleware/rbac.js
client/src/context/AuthContext.jsx
```

---

## 👥 Employee Management

### Features
- Complete employee CRUD operations
- Department assignment
- Manager hierarchy
- Profile management
- Employment status tracking
- Salary information (role-restricted)

### Database Model: Employee
```prisma
model Employee {
  id              String    @id @default(uuid())
  email           String    @unique
  password        String
  firstName       String
  lastName        String
  role            Role      @default(EMPLOYEE)
  department      String?
  position        String?
  managerId       String?
  manager         Employee? @relation("ManagerRelation", fields: [managerId], references: [id])
  subordinates    Employee[] @relation("ManagerRelation")
  hireDate        DateTime  @default(now())
  salary          Decimal?
  status          EmploymentStatus @default(ACTIVE)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

### Key Files
```
server/src/controllers/employees.controller.js
server/src/routes/employees.routes.js
client/src/pages/EmployeesPage.jsx
client/src/components/employees/EmployeeForm.jsx
```

---

## 📁 Project Management

### Features
- Project CRUD with status tracking
- AI-powered project generation from natural language
- Project collaboration (team members)
- Task breakdown within projects
- Progress tracking
- Risk monitoring (Risk Radar)

### Database Model: Project
```prisma
model Project {
  id              String    @id @default(uuid())
  name            String
  description     String?
  status          ProjectStatus @default(PLANNING)
  priority        Priority  @default(MEDIUM)
  startDate       DateTime?
  endDate         DateTime?
  budget          Decimal?
  ownerId         String
  owner           Employee  @relation(fields: [ownerId], references: [id])
  tasks           Task[]
  members         ProjectMember[]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model ProjectMember {
  id          String   @id @default(uuid())
  projectId   String
  employeeId  String
  role        String   @default("MEMBER")
  addedAt     DateTime @default(now())
  project     Project  @relation(fields: [projectId], references: [id])
  employee    Employee @relation(fields: [employeeId], references: [id])

  @@unique([projectId, employeeId])
}
```

### AI Features
1. **AI Project Generation**: Type "Launch company website" → AI creates full project with tasks
2. **AI Assist**: Get suggestions for existing projects
3. **Risk Radar**: Backend monitors for delays and alerts managers

### Key Files
```
server/src/controllers/projects.controller.js
server/src/services/ai.service.js (generateProjectPlan)
client/src/pages/ProjectsPage.jsx
client/src/components/projects/AiProjectModal.jsx
client/src/components/projects/ProjectShareModal.jsx
```

---

## ✅ Task Management

### Features
- Task CRUD within projects
- Assignment to employees
- Status workflow (TODO → IN_PROGRESS → REVIEW → DONE)
- Priority levels
- Due date tracking
- Time estimates

### Database Model: Task
```prisma
model Task {
  id              String    @id @default(uuid())
  title           String
  description     String?
  status          TaskStatus @default(TODO)
  priority        Priority  @default(MEDIUM)
  dueDate         DateTime?
  estimatedHours  Float?
  actualHours     Float?
  projectId       String
  project         Project   @relation(fields: [projectId], references: [id])
  assigneeId      String?
  assignee        Employee? @relation(fields: [assigneeId], references: [id])
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

### Key Files
```
server/src/controllers/tasks.controller.js
client/src/pages/TasksPage.jsx
client/src/components/tasks/TaskCard.jsx
```

---

## 📄 Document Management

### Features
- File upload and storage
- Document categorization
- Access control by role
- Version tracking
- Search functionality

### Database Model: Document
```prisma
model Document {
  id              String    @id @default(uuid())
  name            String
  fileName        String
  fileType        String
  fileSize        Int
  filePath        String
  category        String?
  description     String?
  uploadedById    String
  uploadedBy      Employee  @relation(fields: [uploadedById], references: [id])
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

### Key Files
```
server/src/controllers/documents.controller.js
server/src/routes/documents.routes.js
client/src/pages/DocumentsPage.jsx
```

---

## 💬 Messaging System

### Features (Planned/Partial)
- Direct messaging between employees
- Hierarchy-aware recipient selection
- Priority levels (NORMAL, URGENT, CRITICAL)
- Read/unread tracking
- AI Bot integration for messaging

### Database Model: Message
```prisma
model Message {
  id          String    @id @default(uuid())
  content     String
  priority    MessagePriority @default(NORMAL)
  senderId    String
  sender      Employee  @relation("SentMessages", fields: [senderId], references: [id])
  recipientId String
  recipient   Employee  @relation("ReceivedMessages", fields: [recipientId], references: [id])
  readAt      DateTime?
  createdAt   DateTime  @default(now())
}
```

### Key Files
```
server/src/controllers/messages.controller.js
client/src/pages/InboxPage.jsx
client/src/components/inbox/ComposeMessageModal.jsx
client/src/services/messageService.js
```

---

## 🤖 AI Bot (Chat Assistant)

### Features
- Natural language chat interface
- Context-aware responses (knows user's role, department)
- Tool execution (create tasks, lookup employees, etc.)
- Conversation history
- Decision logging to AgentAction

### How It Works
1. User sends message to AI Bot
2. Backend sends context + message to Google Gemini
3. AI decides if it needs tools or can respond directly
4. Response logged to AgentAction table
5. Response returned to user

### Available Tools (Partial)
- `getEmployeeInfo` - Look up employee details
- `createTask` - Create a new task
- `getProjectStatus` - Check project progress
- `sendMessage` - Send message to colleague (planned)

### Key Files
```
server/src/controllers/ai_bot.controller.js
server/src/services/aiService.js
client/src/pages/AiBotPage.jsx
client/src/components/ai/ChatInterface.jsx
```

---

## 🧠 Agent Brain (AI Decision Tracking)

### Purpose
Track and visualize every decision the AI makes, including:
- What action it took
- Why it made that decision (reasoning)
- How confident it was (0-100%)
- Whether it succeeded or failed

### Features
- Decision log with filters
- Confidence visualization (green/red bars)
- Low-confidence queue for human review
- Rollback capability
- Statistics dashboard

### Database Model: AgentAction
```prisma
model AgentAction {
  id              String    @id @default(uuid())
  agent_name      String
  agent_version   String?
  action          String
  entity_type     String?
  entity_id       String?
  input_context   Json?
  output_data     Json?
  reasoning       String?
  confidence_score Float?
  status          AgentActionStatus @default(PENDING)
  error_message   String?
  execution_time  Int?
  metadata        Json?
  reviewed_by     String?
  reviewer        Employee? @relation(fields: [reviewed_by], references: [id])
  reviewed_at     DateTime?
  review_notes    String?
  created_at      DateTime  @default(now())
}

enum AgentActionStatus {
  PENDING
  SUCCESS
  FAILURE
  ROLLED_BACK
  NEEDS_REVIEW
}
```

### Auto-Flagging
Actions with confidence < 0.5 (50%) are automatically flagged for human review.

### Key Files
```
server/src/services/agentLogger.js
server/src/controllers/agentActions.controller.js
server/src/routes/agentActions.routes.js
client/src/pages/AgentBrainPage.jsx
```

---

## 📊 Activity Logging

### Purpose
Track human actions in the system (separate from AI decisions).

### Features
- Audit trail for all CRUD operations
- User action history
- Filterable by action type, user, date

### Database Model: ActivityLog
```prisma
model ActivityLog {
  id          String    @id @default(uuid())
  action      String
  entityType  String
  entityId    String?
  details     Json?
  performedBy String
  employee    Employee  @relation(fields: [performedBy], references: [id])
  createdAt   DateTime  @default(now())
}
```

### Key Files
```
server/src/services/activityLogger.js
server/src/controllers/activityLogs.controller.js
client/src/pages/ActivityLogsPage.jsx
```

### Known Issue
⚠️ Activity Logs page shows "Failed to fetch activity logs" error. Needs debugging.

---

## 📈 Dashboard

### Features
- Overview statistics (employees, projects, tasks)
- Recent activity feed
- Quick actions
- Role-based widgets

### Key Files
```
client/src/pages/DashboardPage.jsx
client/src/components/dashboard/StatCard.jsx
```

---

# PART 3: PROJECT STRUCTURE

## Directory Structure

```
BBC Agents/
├── client/                     # Frontend (React + Vite)
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   └── http.js         # Axios instance with interceptors
│   │   ├── components/
│   │   │   ├── ai/
│   │   │   │   └── ChatInterface.jsx
│   │   │   ├── common/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── LoadingSpinner.jsx
│   │   │   ├── dashboard/
│   │   │   ├── employees/
│   │   │   ├── inbox/
│   │   │   │   └── ComposeMessageModal.jsx
│   │   │   ├── projects/
│   │   │   │   ├── AiProjectModal.jsx
│   │   │   │   └── ProjectShareModal.jsx
│   │   │   └── tasks/
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Global auth state
│   │   ├── hooks/
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── EmployeesPage.jsx
│   │   │   ├── ProjectsPage.jsx
│   │   │   ├── TasksPage.jsx
│   │   │   ├── DocumentsPage.jsx
│   │   │   ├── InboxPage.jsx
│   │   │   ├── AiBotPage.jsx
│   │   │   ├── AgentBrainPage.jsx
│   │   │   ├── ActivityLogsPage.jsx
│   │   │   └── LoginPage.jsx
│   │   ├── services/
│   │   │   └── messageService.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                     # Backend (Node.js + Express)
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── migrations/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── employees.controller.js
│   │   │   ├── projects.controller.js
│   │   │   ├── tasks.controller.js
│   │   │   ├── documents.controller.js
│   │   │   ├── messages.controller.js
│   │   │   ├── ai_bot.controller.js
│   │   │   ├── agentActions.controller.js
│   │   │   └── activityLogs.controller.js
│   │   ├── lib/
│   │   │   └── prisma.js       # Shared Prisma instance
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT verification
│   │   │   ├── rbac.js         # Role-based access
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── v1/
│   │   │   │   └── index.js    # API v1 router
│   │   │   ├── auth.routes.js
│   │   │   ├── employees.routes.js
│   │   │   ├── projects.routes.js
│   │   │   ├── tasks.routes.js
│   │   │   ├── documents.routes.js
│   │   │   ├── messages.routes.js
│   │   │   ├── aiBot.routes.js
│   │   │   ├── agentActions.routes.js
│   │   │   └── activityLogs.routes.js
│   │   ├── services/
│   │   │   ├── aiService.js     # AI capabilities
│   │   │   ├── agentLogger.js   # AI decision logging
│   │   │   └── activityLogger.js # Human action logging
│   │   └── app.js              # Express app setup
│   ├── index.js                # Server entry point
│   └── package.json
│
└── README.md
```

---

# PART 4: API REFERENCE

## Base URLs
- **Production**: `https://back-end-production-bad8.up.railway.app`
- **Local**: `http://localhost:3000`

## API Versioning
Routes work at both:
- `/api/v1/endpoint` (preferred)
- `/api/endpoint` (legacy support)

## Authentication
All protected routes require:
```
Authorization: Bearer <jwt_token>
```

---

## Endpoints Overview

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/register` | Register |
| POST | `/api/v1/auth/refresh` | Refresh token |
| GET | `/api/v1/auth/me` | Get current user |

### Employees
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/employees` | List all employees |
| GET | `/api/v1/employees/:id` | Get employee by ID |
| POST | `/api/v1/employees` | Create employee |
| PUT | `/api/v1/employees/:id` | Update employee |
| DELETE | `/api/v1/employees/:id` | Delete employee |
| GET | `/api/v1/employees/:id/subordinates` | Get subordinates |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/projects` | List projects |
| GET | `/api/v1/projects/:id` | Get project |
| POST | `/api/v1/projects` | Create project |
| PUT | `/api/v1/projects/:id` | Update project |
| DELETE | `/api/v1/projects/:id` | Delete project |
| POST | `/api/v1/projects/ai-generate` | AI generate project |
| POST | `/api/v1/projects/:id/members` | Add member |
| DELETE | `/api/v1/projects/:id/members/:memberId` | Remove member |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/tasks` | List tasks |
| GET | `/api/v1/tasks/:id` | Get task |
| POST | `/api/v1/tasks` | Create task |
| PUT | `/api/v1/tasks/:id` | Update task |
| DELETE | `/api/v1/tasks/:id` | Delete task |

### Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/documents` | List documents |
| GET | `/api/v1/documents/:id` | Get document |
| POST | `/api/v1/documents` | Upload document |
| DELETE | `/api/v1/documents/:id` | Delete document |
| GET | `/api/v1/documents/:id/download` | Download file |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/messages` | Get inbox |
| GET | `/api/v1/messages/sent` | Get sent messages |
| POST | `/api/v1/messages` | Send message |
| PUT | `/api/v1/messages/:id/read` | Mark as read |

### AI Bot
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/ai/chat` | Send chat message |
| GET | `/api/v1/ai/history` | Get chat history |

### Agent Actions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/agent-actions` | List AI actions |
| GET | `/api/v1/agent-actions/stats` | Get statistics |
| GET | `/api/v1/agent-actions/low-confidence` | Get review queue |
| GET | `/api/v1/agent-actions/:id` | Get single action |
| POST | `/api/v1/agent-actions/:id/review` | Mark reviewed |
| POST | `/api/v1/agent-actions/:id/rollback` | Rollback action |

### Activity Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/activity-logs` | List activity logs |

---

# PART 5: ARCHITECTURE PATTERNS

## 1. Always Use Shared Prisma Instance
```javascript
// ✅ CORRECT
const prisma = require('../lib/prisma');

// ❌ WRONG - Creates connection issues
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
```

## 2. Frontend API Calls
```javascript
// Always use the configured http instance
import { http } from '../api/http';

// Example
const response = await http.get('/employees');
const data = response.data;
```

## 3. Error Handling Pattern
```javascript
// Controller pattern
const getItems = async (req, res) => {
  try {
    const items = await prisma.item.findMany();
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
};
```

## 4. Auth Middleware Usage
```javascript
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// Protected route
router.get('/employees', authenticate, getEmployees);

// Role-restricted route
router.delete('/employees/:id', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), deleteEmployee);
```

## 5. Activity Logging Pattern
```javascript
const { logActivity } = require('../services/activityLogger');

// After successful action
await logActivity({
  action: 'CREATE',
  entityType: 'Project',
  entityId: project.id,
  performedBy: req.user.id,
  details: { name: project.name }
});
```

## 6. Agent Logging Pattern
```javascript
const agentLogger = require('../services/agentLogger');

// Log AI decision
await agentLogger.logAgentDecision({
  agent_name: 'ChatBot',
  action: 'generate_response',
  reasoning: 'User asked about project status',
  confidence_score: 0.85,
  status: 'SUCCESS',
  output_data: { response: aiResponse }
});
```

---

# PART 6: KNOWN ISSUES & PENDING WORK

## 🔴 Known Issues

### 1. Activity Logs Error
**Problem**: Activity Logs page shows "Failed to fetch activity logs"
**Likely Causes**:
- Route not registered in v1/index.js
- Controller error
- Prisma relation issue

**Debug Steps**:
1. Check `/api/v1/activity-logs` route exists
2. Check controller returns proper JSON
3. Verify ActivityLog model relations

### 2. AI Bot Messaging (Not Implemented)
**Goal**: Allow users to send messages through AI Bot commands
**Planned Commands**:
- "message John: Can we meet tomorrow?" → Sends message
- "check my messages" → Shows inbox
- "reply to Sarah: Thanks!" → Replies to message

---

## 🟡 Pending Features

### 1. AI Bot Messaging Integration
Add message tools to AI Bot:
```javascript
// In aiService.js, add tools:
{
  name: 'sendMessage',
  description: 'Send a message to a colleague',
  parameters: {
    recipientName: 'string',
    content: 'string',
    priority: 'NORMAL | URGENT | CRITICAL'
  }
}
```

### 2. Risk Radar Cron Job
Set up scheduled task to check for:
- Overdue tasks
- Projects behind schedule
- Alert managers automatically

### 3. Notification System
- In-app notifications
- Email notifications (optional)
- Push notifications (optional)

### 4. Reports & Analytics
- Employee performance reports
- Project completion rates
- AI usage statistics

---

# PART 7: DEPLOYMENT GUIDE

## Local Development

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL (or use Railway)

### Setup
```bash
# Clone repo
git clone https://github.com/amakki-a11y/bbc-agents.git
cd bbc-agents

# Backend setup
cd server
npm install
cp .env.example .env  # Configure DATABASE_URL, JWT_SECRET, GEMINI_API_KEY
npx prisma generate
npx prisma db push
npm run dev

# Frontend setup (new terminal)
cd client
npm install
npm run dev
```

### Environment Variables (Server)
```env
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
GEMINI_API_KEY="your-gemini-api-key"
PORT=3000
NODE_ENV=development
```

## Production Deployment (Railway)

### Initial Setup
1. Push code to GitHub
2. Create Railway project
3. Add PostgreSQL database
4. Deploy backend service from GitHub
5. Deploy frontend service from GitHub
6. Configure environment variables

### Deploying Updates
```bash
# Make changes, then:
npx prisma db push  # If schema changed
git add .
git commit -m "Your changes"
git push origin main
# Railway auto-deploys from main branch
```

### Database Migrations
```bash
# Development (creates migration files)
npx prisma migrate dev --name migration_name

# Production (applies migrations)
npx prisma migrate deploy
```

---

# PART 8: CHATGPT CONTINUATION PROMPT

Copy everything below this line to continue development with ChatGPT:

---

```
## BBC Agents - AI-Powered Company Operating System

I need help continuing development on my BBC Agents project. Here's the complete context:

### PROJECT OVERVIEW
BBC Agents is an AI-powered HR/Employee Management System built with:
- Frontend: React 18 + Vite + Tailwind CSS
- Backend: Node.js + Express + Prisma ORM
- Database: PostgreSQL (hosted on Railway)
- AI: Google Gemini API
- Deployment: Railway (auto-deploys from GitHub main branch)

### URLS
- GitHub: https://github.com/amakki-a11y/bbc-agents
- Frontend: https://front-end-production-ad4c.up.railway.app
- Backend: https://back-end-production-bad8.up.railway.app
- Local Path: C:\Users\ABBASS\Desktop\BBC Agents

### LOGIN CREDENTIALS
Email: amakki@bbcorp.trade
Password: Admin123!

### COMPLETED FEATURES
1. ✅ Authentication (JWT, role-based access)
2. ✅ Employee Management (CRUD, hierarchy, departments)
3. ✅ Project Management (CRUD, status tracking)
4. ✅ Task Management (CRUD, assignments, status workflow)
5. ✅ Document Upload System
6. ✅ AI Bot Chat Interface (with Google Gemini)
7. ✅ AI Project Generation (natural language → project plan)
8. ✅ Agent Brain Dashboard (AI decision visualization)
9. ✅ AgentAction Logging (tracks AI decisions with confidence scores)
10. ✅ Project Collaboration (share with team members)
11. ✅ AI Assist Button (help on existing projects)
12. ✅ Risk Radar Backend (monitors for delays)

### KNOWN ISSUES TO FIX
1. 🔴 Activity Logs page shows "Failed to fetch activity logs" error
   - Check route registration in server/src/routes/v1/index.js
   - Verify controller at server/src/controllers/activityLogs.controller.js
   - Check Prisma relations for ActivityLog model

### PENDING FEATURES TO BUILD
1. 🟡 AI Bot Messaging - Add commands like:
   - "message John: Can we meet?"
   - "check my messages"
   - "reply to Sarah: Thanks!"
   - Hierarchy-aware (who can message whom)

2. 🟡 Risk Radar Cron Job - Scheduled checks for:
   - Overdue tasks
   - Projects behind schedule
   - Auto-alert managers

3. 🟡 Notifications System

### CRITICAL ARCHITECTURE RULES
1. ALWAYS use shared Prisma instance:
   ```javascript
   const prisma = require('../lib/prisma');
   ```
   NEVER create new PrismaClient instances.

2. Frontend API calls use:
   ```javascript
   import { http } from '../api/http';
   ```

3. API routes work at both:
   - /api/v1/endpoint (preferred)
   - /api/endpoint (legacy)

4. For AI logging, use:
   ```javascript
   const agentLogger = require('../services/agentLogger');
   await agentLogger.logAgentDecision({...});
   ```

### KEY FILES REFERENCE
| Purpose | Path |
|---------|------|
| Prisma Schema | server/prisma/schema.prisma |
| Prisma Client | server/src/lib/prisma.js |
| Main Express App | server/src/app.js |
| V1 Routes Index | server/src/routes/v1/index.js |
| AI Bot Controller | server/src/controllers/ai_bot.controller.js |
| AI Service | server/src/services/aiService.js |
| Agent Logger | server/src/services/agentLogger.js |
| Activity Logger | server/src/services/activityLogger.js |
| Frontend HTTP | client/src/api/http.js |
| Auth Context | client/src/context/AuthContext.jsx |

### DATABASE MODELS (Key ones)
- Employee (users with roles)
- Project (with ProjectMember for collaboration)
- Task (belongs to Project, assigned to Employee)
- Document (file uploads)
- Message (internal messaging)
- AgentAction (AI decision logs)
- ActivityLog (human action audit trail)

### ROLES HIERARCHY
SUPER_ADMIN > ADMIN > HR > MANAGER > EMPLOYEE

### DEPLOYMENT COMMANDS
```bash
# After code changes:
npx prisma db push  # If schema changed
git add .
git commit -m "message"
git push origin main
# Railway auto-deploys
```

### WHAT I NEED HELP WITH
[Describe your specific task here]

Please provide complete, working code that follows the architecture patterns above. Include:
1. Full file paths for any new/modified files
2. Complete code (not snippets)
3. Any necessary database schema changes
4. Frontend and backend changes if needed
```

---

# END OF DOCUMENTATION

Last Updated: [Current Session Date]
Maintainer: MAK (amakki@bbcorp.trade)
```
