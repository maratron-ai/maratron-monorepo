-- Critical Performance Indexes for Maratron Database
-- These indexes target the most frequent query patterns identified in performance analysis

-- ==================================================
-- RUN-RELATED INDEXES (Highest Priority)
-- ==================================================

-- Index for user runs ordered by date (most common query pattern)
-- Supports: WHERE userId = ? ORDER BY date DESC
CREATE INDEX IF NOT EXISTS idx_runs_user_date 
ON "Runs" ("userId", "date" DESC);

-- Index for user runs ordered by creation time
-- Supports: WHERE userId = ? ORDER BY createdAt DESC  
CREATE INDEX IF NOT EXISTS idx_runs_user_created 
ON "Runs" ("userId", "createdAt" DESC);

-- Index for run queries with shoe filtering
-- Supports: WHERE userId = ? AND shoeId = ?
CREATE INDEX IF NOT EXISTS idx_runs_user_shoe 
ON "Runs" ("userId", "shoeId");

-- ==================================================
-- SOCIAL FEATURE INDEXES (High Traffic)
-- ==================================================

-- Index for social profile posts ordered by creation time
-- Supports: WHERE socialProfileId = ? ORDER BY createdAt DESC
CREATE INDEX IF NOT EXISTS idx_runpost_profile_created 
ON "RunPost" ("socialProfileId", "createdAt" DESC);

-- Index for group posts ordered by creation time  
-- Supports: WHERE groupId = ? ORDER BY createdAt DESC
CREATE INDEX IF NOT EXISTS idx_runpost_group_created 
ON "RunPost" ("groupId", "createdAt" DESC);

-- Index for group membership lookups
-- Supports: WHERE socialProfileId = ?
CREATE INDEX IF NOT EXISTS idx_groupmember_profile 
ON "RunGroupMember" ("socialProfileId");

-- Index for follow relationships
-- Supports: WHERE followerId = ?
CREATE INDEX IF NOT EXISTS idx_follow_follower 
ON "Follow" ("followerId");

-- Index for like queries
-- Supports: WHERE socialProfileId = ?
CREATE INDEX IF NOT EXISTS idx_like_profile 
ON "Like" ("socialProfileId");

-- ==================================================
-- USER DATA INDEXES (Frequent Lookups)
-- ==================================================

-- Index for user shoes filtering by retired status
-- Supports: WHERE userId = ? AND retired = false
CREATE INDEX IF NOT EXISTS idx_shoes_user_retired 
ON "Shoes" ("userId", "retired");

-- Index for active user sessions  
-- Supports: WHERE userId = ? AND active = true
CREATE INDEX IF NOT EXISTS idx_sessions_user_active 
ON "UserSessions" ("userId", "active");

-- Index for session cleanup by expiration
-- Supports: WHERE expiresAt < now()
CREATE INDEX IF NOT EXISTS idx_sessions_expires 
ON "UserSessions" ("expiresAt");

-- ==================================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ==================================================

-- Index for leaderboard queries (user, date range)
-- Supports complex date range queries for leaderboards
CREATE INDEX IF NOT EXISTS idx_runs_date_user 
ON "Runs" ("date", "userId");

-- Index for distance-based queries
-- Supports: WHERE userId = ? ORDER BY distance DESC
CREATE INDEX IF NOT EXISTS idx_runs_user_distance 
ON "Runs" ("userId", "distance" DESC);

-- ==================================================
-- PERFORMANCE MONITORING
-- ==================================================

-- Analyze tables to update statistics after index creation
ANALYZE "Runs";
ANALYZE "RunPost"; 
ANALYZE "RunGroupMember";
ANALYZE "Shoes";
ANALYZE "UserSessions";
ANALYZE "Follow";
ANALYZE "Like";

-- Print completion message
DO $$ 
BEGIN 
    RAISE NOTICE 'Performance indexes created successfully. Query performance should be significantly improved.';
END $$;