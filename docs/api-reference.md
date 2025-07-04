# Maratron API Reference

A comprehensive REST API for the Maratron running and fitness platform. This API provides endpoints for user management, run tracking, social features, AI chat, and training plan management.

## Base URL

- **Local Development**: `http://localhost:3000/api`
- **Production**: `https://[your-domain]/api`

## Authentication

The API uses multiple authentication methods:

- **Session-based**: HTTP-only cookies for web application
- **NextAuth.js**: OAuth integration for third-party authentication
- **Manual Login**: Email/password authentication with session management

### Authentication Headers

```http
Cookie: next-auth.session-token=<session-token>
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": "Additional error details (development only)"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors, missing fields)
- `401` - Unauthorized (authentication required)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `429` - Rate Limited (AI service)
- `500` - Internal Server Error
- `503` - Service Unavailable (AI service)

---

## Authentication & Session Management

### NextAuth Handler

```http
GET/POST /api/auth/[...nextauth]
```

Handles NextAuth.js authentication flows including OAuth providers.

**Authentication**: Public (handles authentication)

### Manual Login

```http
POST /api/auth/login
```

Authenticate user with email and password.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "id": "user-id",
  "name": "User Name",
  "email": "user@example.com",
  "VDOT": 45
}
```

**Errors**:
- `400` - Missing email or password
- `401` - Invalid credentials
- `500` - Server error

### Logout

```http
POST /api/auth/logout
```

Log out current user and clear session.

**Response**:
```json
{
  "message": "Logged out successfully"
}
```

### Current User

```http
GET /api/auth/me
```

Get current authenticated user.

**Authentication**: Session cookie required

**Response**: User object or `401` if not authenticated

---

## User Management

### Get All Users

```http
GET /api/users
```

Retrieve all users (should be protected in production).

**Response**: Array of user objects

### Create User

```http
POST /api/users
```

Create a new user account.

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "age": 30,
  "gender": "male",
  "trainingLevel": "intermediate",
  "VDOT": 45,
  "goals": "Marathon sub-3:30",
  "yearsRunning": 5,
  "weeklyMileage": 40,
  "height": 70,
  "weight": 150,
  "injuryHistory": "None",
  "preferredTrainingDays": "Monday, Wednesday, Friday",
  "preferredTrainingEnvironment": "outdoor",
  "device": "garmin",
  "defaultDistanceUnit": "miles",
  "defaultElevationUnit": "feet"
}
```

**Required Fields**: `email`, `password`

**Response**: User object (without password hash)

**Errors**:
- `400` - Missing email or password
- `409` - Email already exists
- `500` - Server error

### Get User

```http
GET /api/users/{id}
```

Get user by ID.

**Parameters**:
- `id` (path) - User ID

**Response**: User object with selected coach relation

### Update User

```http
PUT /api/users/{id}
```

Update user information.

**Parameters**:
- `id` (path) - User ID

**Request Body**: Partial user object

**Response**: Updated user object

### Delete User

```http
DELETE /api/users/{id}
```

Delete user account.

**Parameters**:
- `id` (path) - User ID

**Response**: Success message

---

## Run Tracking

### Get User Runs

```http
GET /api/runs?userId={userId}
```

Get all runs for a specific user.

**Query Parameters**:
- `userId` (required) - User ID

**Response**: Array of runs ordered by date (newest first)

### Create Run

```http
POST /api/runs
```

Create a new run entry.

**Request Body**:
```json
{
  "date": "2024-01-15T10:00:00Z",
  "duration": "00:45:30",
  "distance": 5.5,
  "distanceUnit": "miles",
  "trainingEnvironment": "outdoor",
  "name": "Morning Run",
  "pace": {
    "pace": "8:15",
    "unit": "miles"
  },
  "elevationGain": 150,
  "elevationGainUnit": "feet",
  "notes": "Great run, felt strong",
  "userId": "user-id",
  "shoeId": "shoe-id"
}
```

**Required Fields**: `date`, `duration`, `distance`, `distanceUnit`, `userId`

**Response**: Created run object

**Business Logic**:
- Auto-generates run name if not provided
- Updates shoe mileage with unit conversion
- Calculates and updates user VDOT if higher than current
- Uses user's default shoe if no shoeId provided

### Get Run

```http
GET /api/runs/{id}
```

Get run by ID.

**Parameters**:
- `id` (path) - Run ID

**Response**: Run object

### Update Run

```http
PUT /api/runs/{id}
```

Update run information.

**Parameters**:
- `id` (path) - Run ID

**Request Body**: Partial run object

**Response**: Updated run object

### Delete Run

```http
DELETE /api/runs/{id}
```

Delete run entry.

**Parameters**:
- `id` (path) - Run ID

**Response**: Success message

---

## Shoe Management

### Get All Shoes

```http
GET /api/shoes
```

Get all shoes (should be user-scoped in production).

**Response**: Array of shoe objects

### Create Shoe

```http
POST /api/shoes
```

Create a new shoe entry.

**Request Body**:
```json
{
  "userId": "user-id",
  "name": "Nike Air Zoom Pegasus",
  "notes": "Daily trainer",
  "currentDistance": 0,
  "distanceUnit": "miles",
  "maxDistance": 400,
  "retired": false
}
```

**Required Fields**: `userId`, `name`, `distanceUnit`, `maxDistance`

**Response**: Created shoe object

**Validation**: Uses Yup schema validation

### Get Shoe

```http
GET /api/shoes/{id}
```

Get shoe by ID.

**Parameters**:
- `id` (path) - Shoe ID

**Response**: Shoe object

### Update Shoe

```http
PUT /api/shoes/{id}
```

Update shoe information.

**Parameters**:
- `id` (path) - Shoe ID

**Request Body**: Partial shoe object

**Response**: Updated shoe object

### Delete Shoe

```http
DELETE /api/shoes/{id}
```

Delete shoe entry.

**Parameters**:
- `id` (path) - Shoe ID

**Response**: Success message

---

## Training Plans

### Get All Training Plans

```http
GET /api/running-plans
```

Get all training plans.

**Response**: Array of training plan objects

### Create Training Plan

```http
POST /api/running-plans
```

Create a new training plan.

**Request Body**:
```json
{
  "userId": "user-id",
  "weeks": 12,
  "planData": {
    "workouts": [],
    "phases": []
  },
  "name": "Marathon Training Plan",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-03-24T00:00:00Z",
  "active": true,
  "raceType": "marathon"
}
```

**Required Fields**: `userId`, `weeks`, `planData`

**Response**: Created training plan object

**Business Logic**:
- Auto-generates plan name based on race type
- Calculates start/end dates if one is provided
- Sets first plan as active by default

### Get Training Plan

```http
GET /api/running-plans/{id}
```

Get training plan by ID.

**Parameters**:
- `id` (path) - Training plan ID

**Response**: Training plan object

### Update Training Plan

```http
PUT /api/running-plans/{id}
```

Update training plan.

**Parameters**:
- `id` (path) - Training plan ID

**Request Body**: Partial training plan object

**Response**: Updated training plan object

### Delete Training Plan

```http
DELETE /api/running-plans/{id}
```

Delete training plan.

**Parameters**:
- `id` (path) - Training plan ID

**Response**: Success message

---

## AI Chat System

### Chat with AI

```http
POST /api/chat
```

Send message to AI coach and get intelligent response.

**Authentication**: NextAuth session required

**Request Body**:
```json
{
  "messages": [
    {
      "role": "user",
      "content": "What pace should I run for my easy runs?"
    }
  ],
  "timezone": "America/New_York"
}
```

**Response**:
```json
{
  "id": "response-id",
  "role": "assistant",
  "content": "Based on your VDOT of 45, your easy pace should be...",
  "mcpStatus": "enhanced",
  "toolCalls": [
    {
      "toolName": "getUserContext",
      "result": "success"
    }
  ],
  "coachName": "Coach Sarah",
  "coachIcon": "🏃‍♀️"
}
```

**MCP Status Values**:
- `enhanced` - Full MCP integration with user data
- `no-data-needed` - General advice, no user data required
- `fallback` - MCP unavailable, using general responses

**Business Logic**:
- Integrates with 50+ specialized running tools
- Automatically sets user context for personalized advice
- Graceful fallback when MCP unavailable
- Coach persona integration

### Chat Health Check

```http
GET /api/chat
```

Check API status and MCP connection.

**Response**:
```json
{
  "status": "healthy",
  "mcp": {
    "connected": true,
    "toolsAvailable": 52
  },
  "timestamp": "2024-01-15T10:00:00Z"
}
```

---

## Social Features

### Social Feed

```http
GET /api/social/feed?userId={userId}
```

Get personalized social feed for user.

**Query Parameters**:
- `userId` (required) - User ID

**Response**: Array of posts from followed users with engagement metrics

### Follow User

```http
POST /api/social/follow
```

Follow another user.

**Request Body**:
```json
{
  "followerId": "user-id",
  "followingId": "target-user-id"
}
```

**Response**: Follow relationship object

### Check Follow Status

```http
GET /api/social/follow?followerId={followerId}&followingId={followingId}
```

Check if user is following another user.

**Query Parameters**:
- `followerId` (required) - Follower user ID
- `followingId` (required) - Following user ID

**Response**:
```json
{
  "following": true
}
```

### Unfollow User

```http
DELETE /api/social/follow
```

Unfollow a user.

**Request Body**:
```json
{
  "followerId": "user-id",
  "followingId": "target-user-id"
}
```

**Response**: Empty object

### Get All Posts

```http
GET /api/social/posts
```

Get all posts with social profile information.

**Response**: Array of posts

### Create Post

```http
POST /api/social/posts
```

Create a new social post.

**Request Body**:
```json
{
  "socialProfileId": "profile-id",
  "content": "Just finished a great 10K run!",
  "runId": "run-id",
  "image": "/uploads/run-photo.jpg"
}
```

**Response**: Created post object

### Get Post

```http
GET /api/social/posts/{id}
```

Get post by ID with comments and likes.

**Parameters**:
- `id` (path) - Post ID

**Response**: Post object with comments, likes, and social profile

### Update Post

```http
PUT /api/social/posts/{id}
```

Update post content.

**Parameters**:
- `id` (path) - Post ID

**Request Body**: Partial post object

**Response**: Updated post object

### Delete Post

```http
DELETE /api/social/posts/{id}
```

Delete post.

**Parameters**:
- `id` (path) - Post ID

**Response**: Empty object

### Like Post

```http
POST /api/social/posts/{id}/like
```

Like a post.

**Parameters**:
- `id` (path) - Post ID

**Request Body**:
```json
{
  "socialProfileId": "profile-id"
}
```

**Response**: Like object

### Unlike Post

```http
DELETE /api/social/posts/{id}/like
```

Unlike a post.

**Parameters**:
- `id` (path) - Post ID

**Request Body**:
```json
{
  "socialProfileId": "profile-id"
}
```

**Response**: Empty object

### Get Post Comments

```http
GET /api/social/posts/{id}/comments
```

Get all comments for a post.

**Parameters**:
- `id` (path) - Post ID

**Response**: Array of comments with social profile information

### Add Comment

```http
POST /api/social/posts/{id}/comments
```

Add comment to a post.

**Parameters**:
- `id` (path) - Post ID

**Request Body**:
```json
{
  "socialProfileId": "profile-id",
  "text": "Great run! Keep it up!"
}
```

**Response**: Created comment object

### Get Groups

```http
GET /api/social/groups?profileId={profileId}
```

Get all groups, optionally with user membership status.

**Query Parameters**:
- `profileId` (optional) - Include membership status for this profile

**Response**: Array of groups with member/post counts

### Create Group

```http
POST /api/social/groups
```

Create a new running group.

**Request Body**:
```json
{
  "name": "Local Marathon Runners",
  "ownerId": "user-id",
  "password": "secret123",
  "description": "Group for local marathon training",
  "private": true
}
```

**Response**: Created group object (without password)

**Business Logic**:
- Auto-adds creator to private groups
- Hashes password for private groups

### Search Users

```http
GET /api/social/search?q={query}&profileId={profileId}
```

Search for users by name or username.

**Query Parameters**:
- `q` (required) - Search query
- `profileId` (optional) - Include follow status

**Response**: Array of matching social profiles with running stats

---

## Content Management

### File Upload

```http
POST /api/upload
```

Upload image files.

**Request Body**: FormData with `file` field

**File Restrictions**:
- **Types**: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- **Size**: Max 5MB

**Response**:
```json
{
  "url": "/uploads/efa88abc-b0e3-4367-a36a-6fbd5f5d34ac.jpeg"
}
```

**Business Logic**:
- Generates UUID filename
- Saves to `public/uploads` directory

---

## Specialized Features

### Leaderboards

```http
GET /api/leaderboards?period={period}&type={type}&groupId={groupId}&limit={limit}
```

Get leaderboard data for groups.

**Query Parameters**:
- `period` (required) - `weekly` or `monthly`
- `type` (required) - `group`
- `groupId` (required) - Group ID
- `limit` (optional) - Number of entries (default: 10)

**Response**: Leaderboard data with rankings and user position

### Get Coaches

```http
GET /api/coaches
```

Get available AI coach personas.

**Response**: Array of coach objects

### Get Current Coach

```http
GET /api/user/coach
```

Get current user's selected coach.

**Authentication**: NextAuth session required

**Response**: User object with selected coach

### Update Coach Selection

```http
PUT /api/user/coach
```

Update user's selected coach.

**Authentication**: NextAuth session required

**Request Body**:
```json
{
  "coachId": "coach-id"
}
```

**Response**: Updated user object with coach

### Contact Form

```http
POST /api/contact
```

Submit contact form.

**Request Body**:
```json
{
  "email": "user@example.com",
  "message": "I need help with my training plan"
}
```

**Response**:
```json
{
  "success": true
}
```

### Newsletter Signup

```http
POST /api/newsletter
```

Subscribe to newsletter.

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response**:
```json
{
  "success": true
}
```

---

## Performance Monitoring & Caching

### Application Performance Metrics

```http
GET /api/performance
```

Get comprehensive application performance metrics.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "uptime": 123456,
  "memory": {
    "used": "45.2 MB",
    "total": "512 MB",
    "percentage": 8.8
  },
  "database": {
    "healthy": true,
    "connectionPool": {
      "active": 2,
      "idle": 8,
      "total": 10
    },
    "averageQueryTime": "12ms"
  },
  "cache": {
    "enabled": true,
    "healthy": true,
    "stats": {
      "hits": 1248,
      "misses": 152,
      "total": 1400,
      "hitRate": 89.1,
      "errors": 0
    }
  }
}
```

**Metrics Included**:
- System health status
- Memory usage
- Database connection pool status
- Cache performance statistics
- Uptime tracking

### Cache Health & Statistics

```http
GET /api/performance?action=cache
```

Get detailed Redis cache health and performance statistics.

**Response**:
```json
{
  "cache": {
    "enabled": true,
    "healthy": true,
    "connectionStatus": "connected",
    "stats": {
      "hits": 2847,
      "misses": 356,
      "total": 3203,
      "hitRate": 88.9,
      "errors": 0,
      "operations": {
        "get": 3203,
        "set": 425,
        "delete": 89,
        "invalidate": 12
      }
    },
    "redisInfo": {
      "redis_version": "7.0.0",
      "used_memory_human": "2.1M",
      "used_memory_peak_human": "3.8M",
      "connected_clients": "3",
      "total_commands_processed": "15234",
      "instantaneous_ops_per_sec": "127",
      "keyspace_hits": "2847",
      "keyspace_misses": "356"
    },
    "cacheStrategies": {
      "USER_PROFILE": {
        "ttl": 900,
        "hits": 1245,
        "misses": 89,
        "hitRate": 93.3
      },
      "USER_RUNS": {
        "ttl": 300,
        "hits": 892,
        "misses": 156,
        "hitRate": 85.1
      },
      "LEADERBOARD": {
        "ttl": 600,
        "hits": 456,
        "misses": 67,
        "hitRate": 87.2
      },
      "SOCIAL_FEED": {
        "ttl": 180,
        "hits": 254,
        "misses": 44,
        "hitRate": 85.2
      }
    }
  }
}
```

**Cache Strategy Details**:
- Individual strategy performance metrics
- Hit rates per cache type
- TTL configuration validation
- Memory usage per strategy

### Database Performance Metrics

```http
GET /api/performance?action=database
```

Get detailed database performance and health metrics.

**Response**:
```json
{
  "database": {
    "healthy": true,
    "connectionStatus": "connected",
    "pool": {
      "active": 3,
      "idle": 7,
      "total": 10,
      "waiting": 0
    },
    "performance": {
      "averageQueryTime": "8.3ms",
      "slowestQuery": "45ms",
      "totalQueries": 15432,
      "queriesPerSecond": 12.4
    },
    "tableStats": {
      "Users": {
        "rows": 156,
        "size": "2.1MB",
        "indexHitRate": 99.2
      },
      "Runs": {
        "rows": 3245,
        "size": "12.8MB",
        "indexHitRate": 97.8
      },
      "Shoes": {
        "rows": 489,
        "size": "1.2MB",
        "indexHitRate": 98.9
      }
    },
    "recentSlowQueries": [
      {
        "query": "SELECT * FROM \"Runs\" WHERE ...",
        "duration": "45ms",
        "timestamp": "2024-01-15T10:00:00.000Z"
      }
    ]
  }
}
```

**Database Insights**:
- Connection pool health
- Query performance metrics
- Table-level statistics
- Slow query identification

### Cache Key Management

```http
GET /api/performance/cache/keys?pattern={pattern}
```

List active cache keys (development only).

**Query Parameters**:
- `pattern` (optional) - Redis pattern for key filtering (e.g., `user:*`)

**Response**:
```json
{
  "keys": [
    "maratron:dev:user:profile:123e4567-e89b-12d3-a456-426614174000",
    "maratron:dev:user:runs:123e4567-e89b-12d3-a456-426614174000:1",
    "maratron:dev:leaderboard:group:456:weekly"
  ],
  "total": 247,
  "filtered": 3,
  "pattern": "user:*"
}
```

**Security Note**: Only available in development environment

### Cache Statistics Reset

```http
POST /api/performance/cache/reset-stats
```

Reset cache statistics counters (development only).

**Response**:
```json
{
  "message": "Cache statistics reset successfully",
  "resetTime": "2024-01-15T10:00:00.000Z"
}
```

### Performance Alerts

```http
GET /api/performance/alerts
```

Get current performance alerts and warnings.

**Response**:
```json
{
  "alerts": [
    {
      "type": "warning",
      "category": "cache",
      "message": "Cache hit rate below 85% for USER_RUNS strategy",
      "metric": "hit_rate",
      "value": 82.3,
      "threshold": 85,
      "timestamp": "2024-01-15T09:45:00.000Z"
    },
    {
      "type": "info",
      "category": "database",
      "message": "Average query time increased to 15ms",
      "metric": "avg_query_time",
      "value": 15.2,
      "threshold": 10,
      "timestamp": "2024-01-15T09:30:00.000Z"
    }
  ],
  "summary": {
    "critical": 0,
    "warning": 1,
    "info": 1,
    "total": 2
  }
}
```

**Alert Categories**:
- `critical` - Immediate attention required
- `warning` - Performance degradation detected
- `info` - Notable performance changes

### Cache Warmup (Development)

```http
POST /api/performance/cache/warmup
```

Trigger cache warmup for common data patterns (development only).

**Request Body**:
```json
{
  "strategies": ["USER_PROFILE", "LEADERBOARD"],
  "userIds": ["123e4567-e89b-12d3-a456-426614174000"],
  "force": false
}
```

**Response**:
```json
{
  "message": "Cache warmup completed",
  "warmed": {
    "USER_PROFILE": 15,
    "LEADERBOARD": 3
  },
  "duration": "2.3s",
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

### Health Check (Simple)

```http
GET /api/health
```

Simplified health check for monitoring systems.

**Response**:
```json
{
  "status": "healthy",
  "services": {
    "database": "healthy",
    "cache": "healthy",
    "mcp": "healthy"
  },
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

**Status Values**:
- `healthy` - All systems operational
- `degraded` - Some performance issues
- `unhealthy` - Critical issues detected

---

## AI Tools & Capabilities

The AI chat system includes 50+ specialized tools for running advice:

### Core Data Access
- `getUserRuns` - Retrieve user's running history
- `getUserShoes` - Get shoe rotation and mileage
- `getUserContext` - Comprehensive user profile and preferences

### Training & Analytics
- `getTrainingPlans` - Access training plan data
- `analyzePerformance` - Performance trend analysis
- `getGoalProgress` - Goal tracking and recommendations

### Social Features
- `getSocialFeed` - User's social activity
- `getRunningGroups` - Group memberships and activities

### Health & Recovery
- `analyzeInjuryRisk` - Injury prevention analysis
- `getRecoveryMetrics` - Recovery recommendations

### Equipment & Gear
- `analyzeShoeRotation` - Shoe rotation recommendations
- `getGearRecommendations` - Equipment suggestions

### Competition & Racing
- `getRaceStrategy` - Race planning and strategy
- `analyzeRaceReadiness` - Readiness assessment

### Weather Integration
- `getCurrentWeather` - Current weather conditions
- `getWeatherForecast` - Weather planning for runs

---

## Rate Limiting

AI chat endpoints are rate limited:
- **Limit**: 10 requests per minute per user
- **Headers**: Rate limit info included in responses
- **Error**: `429 Too Many Requests` when exceeded

---

## Development Notes

### Security Considerations

**⚠️ Production Security Requirements**:
- Add proper authorization middleware
- Implement user ownership verification
- Add rate limiting on all endpoints
- Secure file upload with authentication
- Add CORS configuration
- Enable password verification in login

### Business Logic Highlights

**VDOT Calculation**: Automatically calculated using Jack Daniels methodology, only updates if higher than current.

**Shoe Mileage Tracking**: Automatically increments shoe mileage with unit conversion when runs are created.

**Training Plan Management**: Auto-generates plan names and handles date arithmetic for plan duration.

**Social Feed Algorithm**: Shows posts from followed users ordered by creation date with engagement metrics.

**AI Chat Integration**: 50+ specialized tools with automatic user context management and graceful fallback.

---

## Examples

### Complete Run Creation Flow

```bash
# 1. Create user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "VDOT": 45
  }'

# 2. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'

# 3. Create shoe
curl -X POST http://localhost:3000/api/shoes \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id",
    "name": "Nike Pegasus",
    "distanceUnit": "miles",
    "maxDistance": 400
  }'

# 4. Create run
curl -X POST http://localhost:3000/api/runs \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-15T10:00:00Z",
    "duration": "00:45:30",
    "distance": 5.5,
    "distanceUnit": "miles",
    "userId": "user-id",
    "shoeId": "shoe-id"
  }'

# 5. Chat with AI about the run
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=session-token" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "How was my last run? Any recommendations?"
      }
    ]
  }'
```

### Social Features Flow

```bash
# 1. Create social post
curl -X POST http://localhost:3000/api/social/posts \
  -H "Content-Type: application/json" \
  -d '{
    "socialProfileId": "profile-id",
    "content": "Just finished a great 10K run!",
    "runId": "run-id"
  }'

# 2. Like the post
curl -X POST http://localhost:3000/api/social/posts/post-id/like \
  -H "Content-Type: application/json" \
  -d '{
    "socialProfileId": "profile-id"
  }'

# 3. Add comment
curl -X POST http://localhost:3000/api/social/posts/post-id/comments \
  -H "Content-Type: application/json" \
  -d '{
    "socialProfileId": "profile-id",
    "text": "Great job! Keep it up!"
  }'

# 4. Follow user
curl -X POST http://localhost:3000/api/social/follow \
  -H "Content-Type: application/json" \
  -d '{
    "followerId": "user-id",
    "followingId": "target-user-id"
  }'

# 5. Get social feed
curl -X GET http://localhost:3000/api/social/feed?userId=user-id
```

---

*Last updated: January 2024*
*API Version: 1.0*