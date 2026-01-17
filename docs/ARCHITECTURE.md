# System Architecture

## Overview
The BBC Agents application follows a classic client-server architecture, containerized for consistent deployment.

```mermaid
graph TD
    Client[Client (React/Vite)] -->|HTTP/REST| Server[Server (Node/Express)]
    Server -->|Queries| DB[(PostgreSQL)]
    Server -->|External API| OpenAI[OpenAI API]
```

## Technology Stack

### Frontend
-   **Framework**: React
-   **Build Tool**: Vite
-   **Styling**: Vanilla CSS / Tailwind (if configured)
-   **State Management**: React Hooks / Context

### Backend
-   **Runtime**: Node.js
-   **Framework**: Express.js
-   **Database ORM**: Prisma
-   **Authentication**: JSON Web Tokens (JWT) / bcrypt

### Database
-   **System**: PostgreSQL
-   **Schema Management**: Prisma Migrate

### Infrastructure
-   **Containerization**: Docker & Docker Compose

## Data Flow

1.  **User Request**: Client sends a request (e.g., "Create Task") to the Express server.
2.  **Authentication**: Middleware verifies the JWT token.
3.  **Controller**: Validates input and calls the service layer (or directly interacts with Prisma).
4.  **Database Interaction**: Prisma executes the query against PostgreSQL.
5.  **Response**: Server sends a JSON response back to the Client.

## Database Schema Overview

-   **User**: Stores user credentials and profile.
-   **Project**: Groups tasks together. Managed by users.
-   **Task**: Main entity. Linked to User and Project. Supports subtasks, tags, and status.
-   **Event**: Calendar events.
-   **Activity**: Tracks history of actions (auditing).
