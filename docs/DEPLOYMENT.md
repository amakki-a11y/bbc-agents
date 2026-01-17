# Deployment Guide

This document outlines the CI/CD pipeline and deployment strategies for the BBC Agents application.

## CI/CD Pipeline

The project uses GitHub Actions for Continuous Integration and Continuous Deployment.

### 1. Continuous Integration (CI)
**Workflow File:** `.github/workflows/ci.yml`

This workflow runs on every Pull Request and Push to `main`. It performs the following checks:
- **Client**:
    - Installs dependencies (`npm ci`)
    - Runs Linting (`npm run lint`)
    - Runs Tests (`npm test`)
    - Verifies Build (`npm run build`)
- **Server**:
    - Installs dependencies (`npm ci`)
    - Runs Tests with a volatile Postgres service (`npm test`)

### 2. Continuous Deployment (CD)
**Workflow File:** `.github/workflows/deploy.yml`

This workflow runs on pushes to the `main` branch or when a tag starting with `v` is pushed.
- **Build & Push**: Builds production Docker images for both Client and Server and pushes them to the GitHub Container Registry (ghcr.io).
- **Deploy**: Triggers a deployment command (placeholder in the workflow) to update the production environment.

## Manual Deployment using Docker Compose

You can deploy the application manually using Docker Compose. This is useful for testing the production build locally or deploying to a server without the automated pipeline.

### Prerequisites
- Docker
- Docker Compose

### Steps
1. **Build and Run**:
   ```bash
   docker-compose -f docker-compose.prod.yml up --build -d
   ```

2. **Access the Application**:
   - Client: `http://localhost`
   - Server: `http://localhost:3000`

### Environment Variables
Ensure you have the necessary environment variables set in `docker-compose.prod.yml` or a `.env` file for production usage.

## Rollback Strategy

Docker images are tagged with the commit SHA and git tags. To rollback:
1. Identify the previous working image tag or commit SHA.
2. Update the deployment configuration to use that specific tag instead of `latest`.
3. Redeploy.

## Troubleshooting

- **Build Failures**: Check the GitHub Actions logs for specific error messages during the `build` or `test` steps.
- **Container Issues**: Use `docker logs <container_id>` to inspect runtime errors in the containers.
