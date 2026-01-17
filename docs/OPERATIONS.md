# Operations Manual

This manual provides guidelines for monitoring, maintaining, and scaling the BBC Agents application in a production environment.

## Monitoring

### Logging
- **Application Logs**: The application writes logs to `stdout`/`stderr`. In Docker, these can be viewed using:
  ```bash
  docker logs -f ai_planner_server
  ```
- **Log Levels**: Ensure `NODE_ENV=production` is set to minimize verbose logging and enable performance optimizations.

### Health Checks
- **Endpoint**: `GET /health` (if implemented) or check root endpoint `GET /`.
- **Database**: Monitor connection status. If the application cannot connect to the database, it will typically crash or log errors on startup.

### Key Metrics to Monitor
- **CPU/Memory Usage**: Monitor container resource usage.
  ```bash
  docker stats
  ```
- **Response Times**: Monitor API latency.
- **Error Rates**: Track 5xx responses.

## Incident Response

### Common Scenarios

1.  **Database Connection Refused**
    -   *Cause*: Database container down, incorrect credentials, or networking issue.
    -   *Action*: Check `docker ps`, verify `DATABASE_URL`, ensure containers are on the same network.

2.  **Application Crashing**
    -   *Cause*: Unhandled exceptions, OOM (Out of Memory).
    -   *Action*: Check logs (`docker logs ai_planner_server --tail 100`). Restart container. Increase memory limits if OOM.

## Backup and Restore

### Database Backup
Use `pg_dump` to create backups of the PostgreSQL database.
```bash
# Backup from Docker container
docker exec -t ai_planner_db pg_dump -U user ai_planner > backup_$(date +%Y%m%d).sql
```

### Database Restore
Use `psql` to restore from a backup.
```bash
# Restore to Docker container
cat backup_file.sql | docker exec -i ai_planner_db psql -U user -d ai_planner
```

## Scaling Strategies

### Vertical Scaling
Increase resources (CPU/RAM) allocated to the Docker containers in `docker-compose.yml` or your orchestration platform.

### Horizontal Scaling
-   **Stateless Server**: The Express server is stateless. You can run multiple instances behind a load balancer (e.g., Nginx, HAProxy, or AWS ALB).
    ```bash
    # Example with Docker Compose (requires load balancer configuration)
    docker-compose up -d --scale server=3
    ```
-   **Database**:
    -   Use a managed database service (RDS, Cloud SQL) for easier scaling.
    -   Implement read replicas for read-heavy workloads.
