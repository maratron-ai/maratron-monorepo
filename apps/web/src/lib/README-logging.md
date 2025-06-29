# Logging System Documentation

## Overview

The Maratron web application uses a comprehensive structured logging system that provides consistent, configurable, and secure logging across all API routes and application components.

## Features

### ✅ Implemented Features

- **Structured Logging**: JSON format for production, pretty-printed for development
- **Log Levels**: ERROR, WARN, INFO, DEBUG with configurable thresholds
- **Request/Response Logging**: Automatic API request and response logging with timing
- **Database Operation Logging**: Optional query and error logging
- **Security Event Logging**: Authentication and security event tracking
- **Context Enrichment**: Automatic request context (method, path, user agent, IP)
- **Error Handling**: Comprehensive error logging with stack traces in debug mode
- **Sensitive Data Protection**: Automatic sanitization of sensitive fields
- **Environment Configuration**: Different logging behaviors for dev/test/production

### 🔧 Configuration

Environment variables for logging control:

```bash
# Log level (error, warn, info, debug)
LOG_LEVEL=info

# Enable/disable features
ENABLE_FILE_LOGGING=false
ENABLE_REQUEST_LOGGING=true
ENABLE_DB_LOGGING=false

# File logging
LOG_FILE=/app/logs/maratron.log
```

## Usage Examples

### Basic API Route Logging

```typescript
import { logger, getRequestContext } from "@lib/logger";

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const context = getRequestContext(request);
  
  try {
    logger.apiRequest('GET', '/api/users', context);
    
    // Your API logic here
    const users = await prisma.user.findMany();
    
    const duration = Date.now() - startTime;
    logger.apiResponse('GET', '/api/users', 200, duration, { 
      ...context, 
      userCount: users.length 
    });
    
    return NextResponse.json(users);
  } catch (error) {
    logger.apiError('GET', '/api/users', error as Error, context);
    return NextResponse.json({ error: "Error fetching users" }, { status: 500 });
  }
}
```

### Database Operation Logging

```typescript
// Log database queries (development only by default)
logger.dbQuery('findMany', 'users', context);
const users = await prisma.user.findMany();

// Log database errors
try {
  await prisma.user.create(userData);
} catch (error) {
  logger.dbError('create', 'users', error as Error, context);
  throw error;
}
```

### Security Event Logging

```typescript
// Authentication events
logger.authEvent('user_login_success', { userId, email });
logger.authEvent('user_login_failed', { email, reason: 'invalid_password' });

// Security events
logger.securityEvent('unauthorized_access_attempt', { 
  path: '/api/admin', 
  userId: null 
});
```

### Custom Logging

```typescript
// Different log levels
logger.error('Critical system error', context, error);
logger.warn('Deprecated API usage', context);
logger.info('User profile updated', { userId });
logger.debug('Cache miss for user data', { userId, cacheKey });
```

## File Structure

```
src/lib/
├── logger.ts              # Main logger implementation
├── config/
│   └── logging.ts         # Logging configuration
└── README-logging.md      # This documentation
```

## Log Format

### Development (Pretty Print)
```
[2024-01-15T10:30:45.123Z] INFO: API Request: GET /api/users
Context: {
  "method": "GET",
  "path": "/api/users",
  "requestId": "req_1234567890_abc123",
  "userAgent": "Mozilla/5.0...",
  "userId": "user-uuid"
}
```

### Production (JSON)
```json
{
  "level": "info",
  "message": "API Request: GET /api/users",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "context": {
    "method": "GET",
    "path": "/api/users",
    "requestId": "req_1234567890_abc123",
    "userAgent": "Mozilla/5.0...",
    "userId": "user-uuid"
  }
}
```

## Security Features

### Sensitive Data Protection

Automatically redacts sensitive fields:
- password, token, secret
- authorization, cookie, session
- apiKey, accessToken, refreshToken

```typescript
// Before sanitization
const context = { 
  userId: 'user-123', 
  password: 'secret123', 
  email: 'user@example.com' 
};

// After sanitization (logged)
{
  "userId": "user-123",
  "password": "[REDACTED]",
  "email": "user@example.com"
}
```

### Request ID Tracking

Every API request gets a unique request ID for correlation:
```
req_1705320645123_abc123def
```

## Middleware Integration

The logging system integrates with Next.js middleware for automatic request tracking:

```typescript
// middleware.ts automatically adds:
// - Request ID headers
// - Request timing
// - Basic request logging
```

## Best Practices

### ✅ Do's

1. **Use appropriate log levels**:
   - `ERROR`: System errors, exceptions
   - `WARN`: Important events, security issues
   - `INFO`: Business logic events, API responses
   - `DEBUG`: Detailed debugging information

2. **Include relevant context**:
   ```typescript
   logger.info('User created', { 
     userId: newUser.id, 
     email: newUser.email,
     registrationSource: 'web'
   });
   ```

3. **Log business events**:
   ```typescript
   logger.info('Training plan generated', { 
     userId, 
     planType: 'marathon', 
     duration: '16 weeks' 
   });
   ```

### ❌ Don'ts

1. **Don't log sensitive data directly**:
   ```typescript
   // ❌ Bad
   logger.info('User login', { password: userPassword });
   
   // ✅ Good
   logger.info('User login attempt', { email: userEmail });
   ```

2. **Don't use console.log/console.error**:
   ```typescript
   // ❌ Bad
   console.error('Error:', error);
   
   // ✅ Good
   logger.error('API Error', context, error);
   ```

3. **Don't log in tight loops without throttling**:
   ```typescript
   // ❌ Bad
   users.forEach(user => {
     logger.debug('Processing user', { userId: user.id });
   });
   
   // ✅ Good
   logger.debug('Processing users batch', { userCount: users.length });
   ```

## Monitoring Integration

The structured logs are compatible with:
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Splunk**
- **DataDog**
- **New Relic**
- **CloudWatch Logs**

## Performance Considerations

- Log level filtering prevents expensive operations in production
- Sensitive data sanitization only runs on logged data
- Database logging disabled by default in production
- Middleware logging is lightweight and non-blocking

## Migration from console.error

Existing API routes have been updated to use the new logging system. The migration pattern:

```typescript
// Before
console.error("Error fetching users:", error);

// After
logger.apiError('GET', '/api/users', error as Error, context);
```

## Future Enhancements

- File rotation and archival
- Log aggregation to external services
- Real-time log streaming
- Performance metrics integration
- Custom log formatters