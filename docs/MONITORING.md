# Monitoring and Observability

This service is equipped with a comprehensive monitoring stack including structured logging, request performance tracking, and system health checks.

## Logging
We use **Winston** for application logging. Logs are stored in the `logs/` directory at the project root.
- **Error logs**: `logs/error-YYYY-MM-DD.log`
- **Combined logs**: `logs/all-YYYY-MM-DD.log`
- **Console**: Output in development mode.

### Log Levels
- `error`: Critical issues
- `warn`: Important runtime situations
- `info`: General application events
- `http`: API request logging
- `debug`: Detailed debugging information

## Health Checks
The service exposes health check endpoints for uptime monitoring and load balancers.

- **`GET /health`**: Basic health check. Returns `200 OK` if the service and database are reachable.
- **`GET /health/detailed`**: Detailed system metrics including:
  - CPU Load
  - Memory Usage
  - Disk Space
  - Uptime

## Performance Monitoring
- **Request Timing**: Every API request is logged with its duration (ms).
- **System Metrics**: Captured via the `/health/detailed` endpoint.
