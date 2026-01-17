# API Documentation

Base URL: `/api` (e.g., `http://localhost:3000/api`)

## Authentication

Authentication is handled via **JWT (JSON Web Tokens)**.
-   **Header**: `Authorization: Bearer <token>`
-   **Token Retrieval**: Obtain a token via the `/auth/login` or `/auth/register` endpoints.

## Error Handling

Responses use standard HTTP status codes:
-   `200`: Success
-   `201`: Created
-   `400`: Bad Request (Validation constraints)
-   `401`: Unauthorized (Missing/Invalid token)
-   `403`: Forbidden
-   `404`: Not Found
-   `500`: Internal Server Error

## Endpoints

### Auth Configuration
**Prefix**: `/auth`

| Method | Endpoint | Description | Body Params |
|--------|----------|-------------|-------------|
| POST | `/register` | Register a new user | `email`, `password` |
| POST | `/login` | Login and receive JWT | `email`, `password` |

### Projects
**Prefix**: `/projects`
*Headers: `Authorization: Bearer <token>`*

| Method | Endpoint | Description | Body Params |
|--------|----------|-------------|-------------|
| GET | `/` | List all projects | - |
| POST | `/` | Create a new project | `name`, `description` (opt) |
| GET | `/:id` | Get project details | - |

### Data (Tasks & Events)
**Prefix**: `/data`
*Headers: `Authorization: Bearer <token>`*

#### Tasks

| Method | Endpoint | Description | Body Params |
|--------|----------|-------------|-------------|
| GET | `/tasks` | List tasks | - |
| POST | `/tasks` | Create task | `title`, `description`, `projectId` (opt), etc. |
| PUT | `/tasks/:id` | Update task | Partial task object |
| DELETE | `/tasks/:id` | Delete task | - |

#### Events

| Method | Endpoint | Description | Body Params |
|--------|----------|-------------|-------------|
| GET | `/events` | List events | - |
| POST | `/events` | Create event | `title`, `start_time`, `end_time` |
| PUT | `/events/:id` | Update event | Partial event object |
| DELETE | `/events/:id` | Delete event | - |

## Rate Limits
(If configured) Standard rate limiting applies to prevent abuse. Check `X-RateLimit-*` headers for details.
