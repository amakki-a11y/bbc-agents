# Validation Rules

This document outlines the validation rules implemented across the application to ensure data integrity and security.

## Backend Validation

The backend uses `express-validator` and `sanitize-html`. Validation middleware returns `400 Bad Request` if rules are violated.

### Authentication
- **Register**:
    - `firstName`, `lastName`: Required, trimmed, sanitized.
    - `email`: Valid email format, normalized.
    - `password`: Min 6 characters.
- **Login**:
    - `email`: Valid email.
    - `password`: Required.

### Projects
- `name`: Required, trimmed, max 50 chars, sanitized.
- `description`: Optional, trimmed, sanitized.
- `status`: Enum (`planning`, `active`, `completed`, `on-hold`).
- `startDate`, `endDate`: ISO8601 dates.

### Tasks
- `title`: Required, trimmed, sanitized.
- `description`: Optional, trimmed, sanitized.
- `status`: Enum (`todo`, `in-progress`, `done`, `blocked`).
- `priority`: Enum (`low`, `medium`, `high`, `urgent`).
- `due_date`: ISO8601 date.
- `projectId`, `assigneeId`: Integers.

### Detailed Task Items
- **Subtasks**: Title required.
- **Comments**: Content required.
- **Action Items**: Content required.

### AI Commands
- **Command**: Required, trimmed.

## Frontend Validation

Frontend uses `zod` schemas which mirror backend rules to provide immediate feedback.

- Strings are trimmed automatically.
- Email fields validate format.
- Dates are checked for validity.

## Security Measures

- **XSS Prevention**: All text inputs are sanitized to strip dangerous HTML tags.
- **SQL Injection**: Prisma ORM is used to prevent SQL injection. Raw queries are avoided.
- **Input Types**: Strict type checking (e.g., ensuring IDs are integers).
