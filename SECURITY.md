# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within this project, please send an e-mail to security@bbcagents.com. All security vulnerabilities will be promptly addressed.

## Security Measures Implemented

### 1. Dependency Security
- **Regular Audits**: We run `npm audit` regularly to identify and fix vulnerable dependencies.
- **Automated Updates**: Critical security updates are applied immediately.

### 2. HTTP Security Headers
We use `helmet` to set secure HTTP headers:
- **Content-Security-Policy (CSP)**: Restricts sources for scripts, styles, and other resources to prevent XSS and data injection attacks.
- **Strict-Transport-Security (HSTS)**: Enforces HTTPS connections.
- **X-Frame-Options**: Prevents clickjacking by denying iframe embedding.
- **X-XSS-Protection**: Adds a layer of protection against Cross-Site Scripting.
- **X-Content-Type-Options**: Prevents MIME-sniffing.

### 3. Authentication Security
- **Password Strength**: Passwords must be at least 8 characters and include uppercase, lowercase, numbers, and special characters.
- **Bcrypt Hashing**: Passwords are hashed using `bcrypt` with a salt round of 10.
- **Dual-Token System**:
  - **Access Tokens**: Short-lived (15 minutes) JWTs for API access.
  - **Refresh Tokens**: Long-lived (7 days) JWTs for obtaining new access tokens.
- **Rate Limiting**:
  - **Login**: Strict limit (10 attempts/hour) to prevent brute-force attacks.
  - **API**: General limit (100 requests/15 min) to prevent abuse.

### 4. Input Security
- **Sanitization**: All incoming requests are sanitized using `xss-clean` to prevent XSS payloads.
- **Parameter Pollution**: Protected against HTTP Parameter Pollution (HPP).
- **SQL Injection**: We use Prisma ORM which uses parameterized queries, effectively preventing SQL injection attacks.
- **Input Validation**: Critical inputs (auth) are validated using `Zod` schemas.

### 5. CORS
- Configured to allow requests only from trusted frontend domains (e.g., `http://localhost:5173`).

## Known Issues / Roadmap
- **CSRF**: Currently relying on JWT in Authorization header. If moving to cookie-based session storage, CSRF tokens will be required.
- **Refresh Token Storage**: Currently returned in API response. Recommended to move to `HttpOnly` cookies for better XSS protection in future updates.
