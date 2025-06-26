"""Refactored MCP Server with proper Tools vs Resources separation."""
import os
import asyncpg
import uuid
import logging
from typing import Optional
from mcp.server.fastmcp import FastMCP
from .config import get_config, Config
from .database_utils import (
    handle_database_errors,
    execute_with_timeout,
    fetch_with_timeout,
    fetchrow_with_timeout,
    quote_identifier,
    validate_connection,
    close_pool
)
from .user_context.tools import (
    set_current_user,
    get_current_user,
    switch_user_context,
    clear_user_context,
    update_user_preferences,
    update_conversation_context,
    get_session_info,
    list_active_sessions,
    track_last_action,
    track_conversation_topic,
    get_user_distance_unit,
    get_user_max_results
)
from .user_context.smart_tools import (
    get_smart_user_context_tool,
    analyze_user_patterns_tool,
    get_motivational_context_tool,
    update_conversation_intelligence_tool
)
from .user_context.context import get_current_user_id
from .security import secure_db, require_user_context, DataAccessViolationError

# Load configuration
config = get_config()

# Initialize FastMCP server with configuration
mcp = FastMCP(config.server.name, config.server.version)

# Configure logging
logging.basicConfig(
    level=getattr(logging, config.server.log_level.value),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Connection pool placeholder
DB_POOL: Optional[asyncpg.Pool] = None

# Use the enhanced quote_identifier from database_utils
_quote_ident = quote_identifier


async def get_pool() -> asyncpg.Pool:
    """Get or create the asyncpg connection pool with configuration."""
    global DB_POOL
    if DB_POOL is None:
        database_url = config.get_database_url()
        logger.info(f"Creating database connection pool to {database_url.split('@')[1] if '@' in database_url else 'database'}")
        
        try:
            DB_POOL = await asyncpg.create_pool(
                database_url,
                min_size=config.database.min_connections,
                max_size=config.database.max_connections,
                command_timeout=config.database.command_timeout
            )
            logger.info(f"Database pool created successfully with {config.database.min_connections}-{config.database.max_connections} connections")
        except Exception as e:
            logger.error(f"Failed to create database pool: {e}")
            raise
    
    return DB_POOL


# =============================================================================
# RESOURCES (Content - what AI can READ)
# =============================================================================

@mcp.resource("database://schema")
@handle_database_errors
async def database_schema() -> str:
    """Get database schema information including all tables and their structure."""
    pool = await get_pool()
    
    # Get all tables
    tables = await fetch_with_timeout(
        pool,
        "SELECT table_name FROM information_schema.tables "
        "WHERE table_schema='public' ORDER BY table_name"
    )
    
    if not tables:
        return "No tables found in database."
    
    result = "# Database Schema\n\n"
    
    for table_row in tables:
        table_name = table_row["table_name"]
        result += f"## Table: {table_name}\n\n"
        
        # Get columns for this table
        columns = await fetch_with_timeout(
            pool,
            "SELECT column_name, data_type, is_nullable FROM information_schema.columns "
            "WHERE table_name=$1 ORDER BY ordinal_position",
            table_name,
        )
        
        if columns:
            result += "| Column | Type | Nullable |\n"
            result += "|--------|------|----------|\n"
            for col in columns:
                nullable = "Yes" if col['is_nullable'] == 'YES' else "No"
                result += f"| {col['column_name']} | {col['data_type']} | {nullable} |\n"
        
        # Get row count
        try:
            ident = _quote_ident(table_name)
            count_row = await fetchrow_with_timeout(pool, f'SELECT COUNT(*) AS cnt FROM {ident}')
            count = count_row["cnt"] if count_row else 0
            result += f"\n**Rows:** {count}\n\n"
        except:
            result += f"\n**Rows:** Error counting\n\n"
    
    track_conversation_topic("database_schema")
    return result


@mcp.resource("users://profile/{user_id}")
@handle_database_errors
async def user_profile(user_id: str) -> str:
    """Get a user's complete profile and information."""
    pool = await get_pool()
    
    # Get user details
    user_row = await fetchrow_with_timeout(
        pool,
        'SELECT * FROM "Users" WHERE id=$1',
        user_id,
    )
    
    if not user_row:
        return f"User {user_id} not found."
    
    result = f"# User Profile: {user_row['name']}\n\n"
    result += f"**Email:** {user_row['email']}\n"
    result += f"**ID:** {user_row['id']}\n"
    
    if user_row.get('age'):
        result += f"**Age:** {user_row['age']}\n"
    if user_row.get('gender'):
        result += f"**Gender:** {user_row['gender']}\n"
    if user_row.get('trainingLevel'):
        result += f"**Training Level:** {user_row['trainingLevel']}\n"
    if user_row.get('goals'):
        goals = ', '.join(user_row['goals']) if user_row['goals'] else 'None set'
        result += f"**Goals:** {goals}\n"
    if user_row.get('yearsRunning'):
        result += f"**Years Running:** {user_row['yearsRunning']}\n"
    if user_row.get('weeklyMileage'):
        result += f"**Weekly Mileage:** {user_row['weeklyMileage']}\n"
    
    result += f"**Default Distance Unit:** {user_row.get('defaultDistanceUnit', 'miles')}\n"
    result += f"**Member Since:** {user_row['createdAt'].strftime('%Y-%m-%d')}\n"
    
    track_conversation_topic("user_profile")
    return result


@mcp.resource("user://profile")
@handle_database_errors
@require_user_context
async def current_user_profile() -> str:
    """Get the current user's profile information."""
    track_conversation_topic("user_profile")
    
    current_user_id = get_current_user_id()
    if not current_user_id:
        return "❌ No user session active. Please set a user first."
    
    pool = await get_pool()
    
    try:
        # Use secure data access to get only current user's profile
        user_data = await secure_db.get_user_profile(pool, current_user_id)
        
        if not user_data:
            return "❌ User profile not found."
        
        # Format profile information
        result = f"# Your Profile\n\n"
        result += f"**Name:** {user_data['name']}\n"
        result += f"**Email:** {user_data['email']}\n"
        result += f"**Training Level:** {user_data.get('trainingLevel', 'Not set')}\n"
        result += f"**Preferred Distance Unit:** {user_data.get('defaultDistanceUnit', 'miles')}\n"
        result += f"**Member Since:** {user_data['createdAt'].strftime('%Y-%m-%d')}\n"
        
        return result
        
    except DataAccessViolationError as e:
        return str(e)
    except Exception as e:
        return f"❌ Error retrieving profile: {str(e)}"


# SECURITY NOTE: The old users_list resource was removed as it exposed ALL users' data
# This violates privacy and data isolation principles


@mcp.resource("runs://user/{user_id}/recent")
@handle_database_errors
async def user_recent_runs(user_id: str) -> str:
    """Get a user's recent runs with detailed information - SECURE VERSION."""
    track_conversation_topic("runs")
    
    try:
        # Use secure data access to enforce user isolation
        pool = await get_pool()
        runs_data = await secure_db.get_user_runs(pool, user_id, get_user_max_results())
        
        if not runs_data:
            return f"No runs found for this user."
        
        # Get user name securely
        user_profile = await secure_db.get_user_profile(pool, user_id)
        user_name = user_profile['name'] if user_profile else "User"
        
        result = f"# Recent Runs for {user_name}\n\n"
        result += f"Showing {len(runs_data)} most recent runs:\n\n"
        
        preferred_unit = get_user_distance_unit()
        
        for i, row in enumerate(runs_data, 1):
            date_str = row['date'].date().strftime('%Y-%m-%d')
            distance = row['distance']
            unit = row['distanceUnit']
            
            # Convert units if user has a preference and it's different
            if preferred_unit and preferred_unit != unit:
                if preferred_unit == "kilometers" and unit == "miles":
                    distance = round(distance * 1.60934, 2)
                    unit = "kilometers"
                elif preferred_unit == "miles" and unit == "kilometers":
                    distance = round(distance / 1.60934, 2)
                    unit = "miles"
            
            result += f"## Run {i}: {date_str}\n"
            result += f"- **Distance:** {distance} {unit}\n"
            result += f"- **Duration:** {row['duration']}\n"
            
            if row.get('pace'):
                result += f"- **Pace:** {row['pace']}\n"
            if row.get('name'):
                result += f"- **Name:** {row['name']}\n"
            if row.get('elevationGain'):
                result += f"- **Elevation Gain:** {row['elevationGain']}\n"
            if row.get('notes'):
                result += f"- **Notes:** {row['notes']}\n"
            
            result += "\n"
        
        return result
        
    except DataAccessViolationError as e:
        return str(e)
    except Exception as e:
        return f"❌ Error retrieving runs: {str(e)}"


@mcp.resource("runs://user/{user_id}/summary/{period}")
@handle_database_errors
async def user_run_summary(user_id: str, period: str = "30d") -> str:
    """Get a summary of user's runs for a specific period - SECURE VERSION."""
    track_conversation_topic("run_summary")
    
    try:
        # Parse period (30d, 7d, 90d, etc.)
        if period.endswith('d'):
            days = int(period[:-1])
        else:
            days = 30  # default
        
        pool = await get_pool()
        
        # Use secure data access to get user profile
        user_profile = await secure_db.get_user_profile(pool, user_id)
        if not user_profile:
            return "❌ User not found."
        
        user_name = user_profile['name']
        preferred_unit = user_profile.get('defaultDistanceUnit', 'miles')
        
        # Get run statistics with secure query
        current_user = get_current_user_id()
        if current_user != user_id:
            raise DataAccessViolationError("🔒 Access denied: Can only access your own data")
        
        stats_query = '''
            SELECT 
                COUNT(*) as run_count,
                SUM(distance) as total_distance,
                AVG(distance) as avg_distance,
                MIN(distance) as min_distance,
                MAX(distance) as max_distance
            FROM "Runs" 
            WHERE "userId"=$1 AND date >= NOW() - INTERVAL '%s days'
        '''
        
        stats_row = await secure_db.secure_fetchrow(
            pool, stats_query, user_id, days, table_name="Runs"
        )
        
        if not stats_row or stats_row['run_count'] == 0:
            return f"No runs found for {user_name} in the last {days} days."
        
        result = f"# Running Summary for {user_name}\n"
        result += f"**Period:** Last {days} days\n\n"
        
        # Convert distances to preferred unit if needed
        total_dist = float(stats_row['total_distance'] or 0)
        avg_dist = float(stats_row['avg_distance'] or 0)
        min_dist = float(stats_row['min_distance'] or 0)
        max_dist = float(stats_row['max_distance'] or 0)
        
        result += f"## Summary Statistics\n"
        result += f"- **Total Runs:** {stats_row['run_count']}\n"
        result += f"- **Total Distance:** {total_dist:.2f} {preferred_unit}\n"
        result += f"- **Average Distance:** {avg_dist:.2f} {preferred_unit}\n"
        result += f"- **Shortest Run:** {min_dist:.2f} {preferred_unit}\n"
        result += f"- **Longest Run:** {max_dist:.2f} {preferred_unit}\n"
        result += f"- **Runs per Week:** {(stats_row['run_count'] * 7 / days):.1f}\n"
        
        return result
        
    except DataAccessViolationError as e:
        return str(e)
    except Exception as e:
        return f"❌ Error generating summary: {str(e)}"


@mcp.resource("shoes://user/{user_id}")
@handle_database_errors
async def user_shoes(user_id: str) -> str:
    """Get a user's shoe collection and usage information - SECURE VERSION."""
    track_conversation_topic("shoes")
    
    try:
        pool = await get_pool()
        
        # Use secure data access to get user profile and shoes
        user_profile = await secure_db.get_user_profile(pool, user_id)
        if not user_profile:
            return "❌ User not found."
        
        user_name = user_profile['name']
        
        # Get shoes using secure method
        shoes_data = await secure_db.get_user_shoes(pool, user_id)
        
        if not shoes_data:
            return f"No shoes found for {user_name}."
        
        result = f"# Shoe Collection for {user_name}\n\n"
        
        active_shoes = [shoe for shoe in shoes_data if not shoe['retired']]
        retired_shoes = [shoe for shoe in shoes_data if shoe['retired']]
        
        if active_shoes:
            result += f"## Active Shoes ({len(active_shoes)})\n\n"
            for shoe in active_shoes:
                current = shoe['currentDistance']
                max_dist = shoe['maxDistance']
                unit = shoe['distanceUnit']
                percentage = (current / max_dist * 100) if max_dist > 0 else 0
                
                result += f"### {shoe['name']}\n"
                result += f"- **Usage:** {current}/{max_dist} {unit} ({percentage:.1f}%)\n"
                result += f"- **Added:** {shoe['createdAt'].strftime('%Y-%m-%d')}\n"
                if shoe.get('notes'):
                    result += f"- **Notes:** {shoe['notes']}\n"
                result += "\n"
        
        if retired_shoes:
            result += f"## Retired Shoes ({len(retired_shoes)})\n\n"
            for shoe in retired_shoes:
                result += f"- **{shoe['name']}** (retired)\n"
        
        return result
        
    except DataAccessViolationError as e:
        return str(e)
    except Exception as e:
        return f"❌ Error retrieving shoes: {str(e)}"


@mcp.resource("database://stats")
@handle_database_errors
async def database_stats() -> str:
    """Get database statistics and row counts for all tables."""
    pool = await get_pool()
    
    # Get all tables
    tables = await fetch_with_timeout(
        pool,
        "SELECT table_name FROM information_schema.tables "
        "WHERE table_schema='public' ORDER BY table_name"
    )
    
    if not tables:
        return "No tables found in database."
    
    result = "# Database Statistics\n\n"
    result += "| Table | Row Count |\n"
    result += "|-------|----------|\n"
    
    total_rows = 0
    for table_row in tables:
        table_name = table_row["table_name"]
        try:
            ident = _quote_ident(table_name)
            count_row = await fetchrow_with_timeout(
                pool, f'SELECT COUNT(*) AS cnt FROM {ident}'
            )
            count = count_row["cnt"] if count_row else 0
            total_rows += count
            result += f"| {table_name} | {count:,} |\n"
        except Exception:
            result += f"| {table_name} | Error |\n"
    
    result += f"\n**Total Rows:** {total_rows:,}\n"
    
    track_conversation_topic("database_stats")
    return result


# =============================================================================
# TOOLS (Actions - what AI can do)
# =============================================================================

@mcp.tool()
@handle_database_errors
async def add_user(name: str, email: str) -> str:
    """Create a new user in the database.
    
    Args:
        name: User's full name
        email: User's email address
    """
    pool = await get_pool()
    user_id = str(uuid.uuid4())
    
    await execute_with_timeout(
        pool,
        'INSERT INTO "Users" (id, name, email, "updatedAt") '
        'VALUES ($1, $2, $3, NOW())',
        user_id,
        name,
        email,
    )
    
    track_last_action("add_user")
    return f"✅ Created user '{name}' with ID: {user_id}"


@mcp.tool()
@handle_database_errors
async def update_user_email(user_id: str, email: str) -> str:
    """Update a user's email address.
    
    Args:
        user_id: The user's ID
        email: New email address
    """
    pool = await get_pool()
    
    result = await execute_with_timeout(
        pool,
        'UPDATE "Users" SET email=$1, "updatedAt"=NOW() WHERE id=$2',
        email,
        user_id,
    )
    
    if result.endswith("0"):
        return f"❌ User {user_id} not found."
    
    track_last_action("update_user_email")
    return f"✅ Updated email for user {user_id} to {email}"


@mcp.tool()
@handle_database_errors
async def delete_user(user_id: str) -> str:
    """Delete a user from the database.
    
    Args:
        user_id: The user's ID to delete
    """
    pool = await get_pool()
    
    result = await execute_with_timeout(
        pool, 
        'DELETE FROM "Users" WHERE id=$1', 
        user_id
    )
    
    if result.endswith("0"):
        return f"❌ User {user_id} not found."
    
    track_last_action("delete_user")
    return f"✅ Deleted user {user_id}"


@mcp.tool()
@handle_database_errors
async def add_run(user_id: str, date: str, duration: str, distance: float,
                  distance_unit: str = "miles", name: str = None, notes: str = None,
                  training_environment: str = None, pace: str = None,
                  elevation_gain: float = None, shoe_id: str = None) -> str:
    """Add a new run record for a user.
    
    Args:
        user_id: The user's ID
        date: Run date (YYYY-MM-DD format)
        duration: Run duration (HH:MM:SS format)
        distance: Distance covered
        distance_unit: "miles" or "kilometers"
        name: Optional name for the run
        notes: Optional notes about the run
        training_environment: Optional training environment (indoor/outdoor/etc.)
        pace: Optional pace information
        elevation_gain: Optional elevation gain
        shoe_id: Optional ID of shoes used
    """
    pool = await get_pool()
    run_id = str(uuid.uuid4())
    
    # Base fields that are always included
    fields = ['id', 'date', 'duration', 'distance', '"distanceUnit"', '"updatedAt"', '"userId"']
    values = [run_id, date, duration, distance, distance_unit, user_id]
    placeholders = ['$1', '$2', '$3', '$4', '$5', 'NOW()', '$6']
    
    # Add optional fields if provided
    param_count = 7
    
    if name is not None:
        fields.append('name')
        values.append(name)
        placeholders.append(f'${param_count}')
        param_count += 1
        
    if notes is not None:
        fields.append('notes')
        values.append(notes)
        placeholders.append(f'${param_count}')
        param_count += 1
        
    if training_environment is not None:
        fields.append('"trainingEnvironment"')
        values.append(training_environment)
        placeholders.append(f'${param_count}')
        param_count += 1
        
    if pace is not None:
        fields.append('pace')
        values.append(pace)
        placeholders.append(f'${param_count}')
        param_count += 1
        
    if elevation_gain is not None:
        fields.append('"elevationGain"')
        values.append(elevation_gain)
        placeholders.append(f'${param_count}')
        param_count += 1
        
    if shoe_id is not None:
        fields.append('"shoeId"')
        values.append(shoe_id)
        placeholders.append(f'${param_count}')
        param_count += 1
    
    query = f'INSERT INTO "Runs" ({", ".join(fields)}) VALUES ({", ".join(placeholders)})'
    
    await execute_with_timeout(pool, query, *values)
    
    track_last_action("add_run")
    return f"✅ Added run for user {user_id} with ID: {run_id}"


@mcp.tool()
@handle_database_errors
async def add_shoe(user_id: str, name: str, max_distance: float, 
                   distance_unit: str = "miles", notes: str = None, 
                   current_distance: float = 0.0, retired: bool = False) -> str:
    """Add a new shoe to a user's collection.
    
    Args:
        user_id: The user's ID
        name: Shoe name/model
        max_distance: Maximum distance before replacement
        distance_unit: "miles" or "kilometers"
        notes: Optional notes about the shoe
        current_distance: Current distance on the shoe (default: 0.0)
        retired: Whether the shoe is retired (default: False)
    """
    pool = await get_pool()
    shoe_id = str(uuid.uuid4())
    
    # Base fields
    fields = ['id', 'name', '"maxDistance"', '"distanceUnit"', '"currentDistance"', 'retired', '"updatedAt"', '"userId"']
    values = [shoe_id, name, max_distance, distance_unit, current_distance, retired, user_id]
    placeholders = ['$1', '$2', '$3', '$4', '$5', '$6', 'NOW()', '$7']
    
    # Add optional notes
    if notes:
        fields.append('notes')
        values.append(notes)
        placeholders.append('$8')
    
    query = f'INSERT INTO "Shoes" ({", ".join(fields)}) VALUES ({", ".join(placeholders)})'
    
    await execute_with_timeout(pool, query, *values)
    
    track_last_action("add_shoe")
    return f"✅ Added shoe '{name}' for user {user_id} with ID: {shoe_id}"


# =============================================================================
# USER CONTEXT MANAGEMENT TOOLS
# =============================================================================

@mcp.tool()
async def set_current_user_tool(user_id: str) -> str:
    """Set the current user context for subsequent operations.
    
    This must be called before using any user-specific resources.
    
    Args:
        user_id: The ID of the user to set as current context
    """
    track_last_action("set_current_user")
    return await set_current_user(user_id)


@mcp.tool()
async def get_current_user_tool() -> str:
    """Get the current user's profile and context information.
    
    Returns detailed information about the current user including preferences,
    cached data, and session information.
    """
    track_last_action("get_current_user")
    return await get_current_user()


@mcp.tool()
async def switch_user_context_tool(user_id: str) -> str:
    """Switch to a different user context.
    
    Useful for admin operations or support scenarios where you need to
    access different user contexts.
    
    Args:
        user_id: The ID of the user to switch to
    """
    track_last_action("switch_user_context")
    return await switch_user_context(user_id)


@mcp.tool()
async def clear_user_context_tool() -> str:
    """Clear the current user context.
    
    Removes the current user session and clears all context.
    """
    track_last_action("clear_user_context")
    return await clear_user_context()


@mcp.tool()
async def update_user_preferences_tool(preferences_json: str) -> str:
    """Update user preferences for the current user.
    
    Available preferences:
    - distance_unit: "miles" or "kilometers"
    - timezone: timezone string (e.g., "UTC", "America/New_York")
    - detailed_responses: true/false
    - include_social_data: true/false
    - max_results_per_query: number (1-100)
    
    Args:
        preferences_json: JSON string with preference updates
        Example: '{"distance_unit": "kilometers", "detailed_responses": false}'
    """
    track_last_action("update_user_preferences")
    track_conversation_topic("preferences")
    return await update_user_preferences(preferences_json)


@mcp.tool()
async def update_conversation_context_tool(context_json: str) -> str:
    """Update conversation context for the current user.
    
    Available context fields:
    - last_topic: string
    - conversation_mood: "positive", "neutral", "frustrated"
    - mentioned_runs: array of run IDs
    - mentioned_shoes: array of shoe IDs
    - mentioned_goals: array of goal strings
    
    Args:
        context_json: JSON string with context updates
        Example: '{"last_topic": "training plan", "conversation_mood": "positive"}'
    """
    track_last_action("update_conversation_context")
    return await update_conversation_context(context_json)


@mcp.tool()
async def get_session_info_tool(user_id: str = "") -> str:
    """Get session information for a user.
    
    Args:
        user_id: Optional user ID. If empty, uses current user.
    """
    track_last_action("get_session_info")
    return await get_session_info(user_id if user_id else None)


@mcp.tool()
async def list_active_sessions_tool() -> str:
    """List all currently active user sessions.
    
    Shows all users with active sessions, their last activity, and session duration.
    """
    track_last_action("list_active_sessions")
    return await list_active_sessions()


@mcp.tool()
@handle_database_errors
async def get_session_history(user_id: str = "", limit: int = 10) -> str:
    """Get session history for a user.
    
    Args:
        user_id: Optional user ID. If empty, uses current user.
        limit: Maximum number of sessions to return (default 10)
    """
    if not user_id:
        from user_context import get_current_user_id
        user_id = get_current_user_id()
        if not user_id:
            return "❌ No user context set and no user_id provided."
    
    pool = await get_pool()
    
    # Get user name
    user_row = await fetchrow_with_timeout(
        pool,
        'SELECT name FROM "Users" WHERE id=$1',
        user_id,
    )
    
    if not user_row:
        return f"❌ User {user_id} not found."
    
    user_name = user_row['name']
    
    # Get session history
    rows = await fetch_with_timeout(
        pool,
        '''SELECT "sessionId", "createdAt", "lastActivity", "expiresAt", active
           FROM "UserSessions" 
           WHERE "userId"=$1 
           ORDER BY "createdAt" DESC 
           LIMIT $2''',
        user_id,
        limit
    )
    
    if not rows:
        return f"📭 No session history found for {user_name}."
    
    result = f"📜 **Session History for {user_name}**\\n\\n"
    
    for i, row in enumerate(rows, 1):
        session_id = row['sessionId'][-20:]  # Last 20 chars
        created = row['createdAt'].strftime('%Y-%m-%d %H:%M UTC')
        last_activity = row['lastActivity'].strftime('%Y-%m-%d %H:%M UTC')
        expires = row['expiresAt'].strftime('%Y-%m-%d %H:%M UTC')
        status = "🟢 Active" if row['active'] else "🔴 Inactive"
        
        duration = row['lastActivity'] - row['createdAt']
        duration_str = f"{duration.total_seconds() / 60:.0f} minutes"
        
        result += f"**Session {i}:** ...{session_id}\\n"
        result += f"• Status: {status}\\n"
        result += f"• Created: {created}\\n"
        result += f"• Last Activity: {last_activity}\\n"
        result += f"• Duration: {duration_str}\\n"
        result += f"• Expires: {expires}\\n\\n"
    
    track_last_action("get_session_history")
    return result


# =============================================================================
# SMART USER CONTEXT TOOLS
# =============================================================================

@mcp.tool()
async def get_smart_user_context() -> str:
    """Get comprehensive, intelligent user context for personalized responses."""
    track_last_action("get_smart_context")
    return await get_smart_user_context_tool()


@mcp.tool()
async def analyze_user_patterns() -> str:
    """Analyze user patterns and provide insights about their running journey."""
    track_last_action("analyze_patterns")
    return await analyze_user_patterns_tool()


@mcp.tool()
async def get_motivational_context() -> str:
    """Get motivational context to help provide encouraging responses."""
    track_last_action("get_motivational_context")
    return await get_motivational_context_tool()


@mcp.tool()
async def update_conversation_intelligence(user_message: str, ai_response: str, 
                                         intent: str = "general", sentiment: str = "neutral") -> str:
    """Update conversation intelligence with rich context from the current interaction."""
    track_last_action("update_conversation_intelligence")
    return await update_conversation_intelligence_tool(user_message, ai_response, intent, sentiment)


# =============================================================================
# HEALTH AND UTILITY FUNCTIONS
# =============================================================================

async def cleanup():
    """Cleanup function to properly close database connections."""
    global DB_POOL
    
    # Cleanup user context manager
    from .user_context.context import get_user_context_manager
    try:
        manager = get_user_context_manager()
        await manager.cleanup()
    except Exception as e:
        logger.error(f"Error cleaning up user context manager: {e}")
    
    # Close database pool
    await close_pool(DB_POOL)
    DB_POOL = None


async def health_check() -> bool:
    """Check if the server and database are healthy."""
    try:
        pool = await get_pool()
        return await validate_connection(pool)
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return False


def main():
    """Main entry point for the MCP server."""
    try:
        # Log startup information
        logger.info(f"Starting {config.server.name} v{config.server.version}")
        logger.info(f"Environment: {config.environment.value}")
        logger.info(f"Log level: {config.server.log_level.value}")
        
        # Initialize and run the server
        mcp.run(transport='stdio')
    except KeyboardInterrupt:
        logger.info("Server shutdown requested")
    except Exception as e:
        logger.error(f"Server startup failed: {e}")
        raise
    finally:
        # Cleanup on exit
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.create_task(cleanup())
            else:
                loop.run_until_complete(cleanup())
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")


if __name__ == "__main__":
    main()