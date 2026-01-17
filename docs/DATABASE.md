# Database Documentation

## Overview
This document outlines the database schema, indexing strategy, and query optimizations implemented for the BBC Agents application. The database uses SQLite with Prisma ORM.

## Schema Architecture

### Core Models

#### User
Central entity.
- `id`: PK
- `email`: Unique, Indexed
- Relationships: Tasks, Projects, Events, Activities, Assigned ActionItems

#### Project
Groups tasks.
- `id`: PK
- `user_id`: FK to User (Indexed)
- `created_at`: Indexed for sorting by newest projects
- Status: No explicit status field, derived from tasks? (N/A)

#### Task
Main work unit.
- `id`: PK
- `user_id`: FK (Indexed)
- `project_id`: FK (Indexed)
- `status`: "todo", "in_progress", etc.
- `priority`, `due_date`, `tags`
- Composite Indexes:
    - `[user_id, status]`: Filter tasks by status for a user.
    - `[user_id, due_date]`: Sort tasks by due date for a user.
    - `[project_id, status]`: Filter tasks by status within a project.

#### Activity
Audit log / history.
- `task_id`: FK (Indexed)
- `timestamp`: Ordered
- Composite Index: `[task_id, timestamp(desc)]` for efficient history retrieval.

### Supporting Models
- **Subtask**, **ActionItem**, **CustomField**, **Attachment**: All have FK indexes to `Task`.
- **Event**, **TimeEntry**: Linked to `User` and `Task`.

## Indexing Strategy

We added indexes to all Foreign Keys (FK) because SQLite does not index them by default, which can cause full table scans during joins (`include` in Prisma).

| Model | Index | Purpose |
|-------|-------|---------|
| User | `email` | Fast login/lookup |
| Project | `user_id`, `[user_id, created_at]` | List projects by user, sorted |
| Task | `user_id`, `project_id` | FK Lookups |
| Task | `[user_id, status]` | Dashboard filtering |
| Task | `[user_id, due_date]` | Upcoming tasks view |
| Activity | `[task_id, timestamp]` | Message/History feed pagination |

## Query Optimizations

### Pagination
- **Endpoint**: `GET /api/tasks`
- **Method**: Cursor-based pagination.
- **Implementation**:
    - Query Params: `limit` (default 50), `cursor` (ID).
    - Response: JSON Array (for backward compatibility).
    - Metadata: `X-Next-Cursor` header.
- **Benefit**: Prevents fetching all tasks (potentially thousands) in one request.

### N+1 Prevention
- Used `include` selectively in Prisma queries.
- **Activity Limit**: `getTaskDetails` restricts `activities` to the last 50 items to prevent loading massive history logs.

## Migration
To apply these changes:
```bash
npx prisma migrate dev
```
(Already executed during optimization phase).
