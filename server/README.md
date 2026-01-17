# Server Documentation

The backend REST API for BBC Agents, built with Node.js and Express.

## 🏗 Architecture

The server follows a Controller-Service-Repository pattern (though focused on Controllers/Routes for simplicity in some areas):
- **Express**: Web framework.
- **Prisma**: ORM for database interaction.
- **PostgreSQL**: Relational database.
- **JWT**: Stateless authentication.

## 🛣 API Routes

### Authentication (`/auth`)
- `POST /auth/register`: Create a new user account.
- `POST /auth/login`: Authenticate and receive a JWT.

### Data (`/api`)
- `GET /api/tasks`: List all tasks.
- `POST /api/tasks`: Create a new task.
- `GET /api/projects`: List all projects.
- `GET /api/tasks/details/:id`: Get detailed task info.

### AI (`/ai`)
- `POST /ai/command`: Process natural language commands to create/update tasks.

## 🗄 Database Schema

The database relies on Prisma. Key models include:
- **User**: App users.
- **Task**: Main work units.
- **Project**: Collections of tasks.
- **ActionItem**: Sub-units or checklists.
- **Event**: Calendar events.

See `prisma/schema.prisma` for the full definition.

## 🔐 Authentication Flow

1.  User sends credentials to `/auth/login`.
2.  Server verifies and issues a JWT token (signed with `JWT_SECRET`).
3.  Client includes `Authorization: Bearer <token>` in subsequent requests.
4.  Middleware verifies the token and attaches the user to `req.user`.

## 🌍 Environment Variables

Create a `.env` file in this directory:

```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/ai_planner
JWT_SECRET=your_secret_key
OPENAI_API_KEY=your_openai_key
```

- **`DATABASE_URL`**: Connection string for PostgreSQL.
- **`JWT_SECRET`**: Secret key for signing tokens.
- **`OPENAI_API_KEY`**: Key for AI features.
