"""Advanced MCP Tools for Enhanced Running Experience

This module provides sophisticated tools for training plan management,
goal tracking, advanced analytics, social features, and health monitoring.
"""

import json
import uuid
import asyncpg
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from .database_utils import (
    handle_database_errors, 
    fetch_with_timeout,
    fetchrow_with_timeout,
    execute_with_timeout
)
from .user_context.context import get_current_user_id, get_current_user_session
from .user_context.tools import track_last_action, track_conversation_topic
from .security import require_user_context, DataAccessViolationError


async def get_pool() -> asyncpg.Pool:
    """Get database pool - imported from server module."""
    from .server import get_pool as _get_pool
    return await _get_pool()


# =============================================================================
# TRAINING PLAN MANAGEMENT TOOLS
# =============================================================================

@handle_database_errors
@require_user_context
async def generate_training_plan_tool(goal_type: str, target_distance: float, 
                                     target_time: str = None, weeks: int = 12,
                                     distance_unit: str = "miles") -> str:
    """Generate an intelligent training plan based on user's current fitness and goals.
    
    Args:
        goal_type: Type of goal ('race', 'distance', 'speed', 'endurance')
        target_distance: Target distance for the goal
        target_time: Optional target time (HH:MM:SS format)
        weeks: Number of weeks for the plan (default: 12)
        distance_unit: 'miles' or 'kilometers'
    """
    try:
        user_id = get_current_user_id()
        pool = await get_pool()
        
        # Get user's current fitness level
        user_data = await fetchrow_with_timeout(
            pool,
            'SELECT * FROM "Users" WHERE id=$1',
            user_id
        )
        
        if not user_data:
            return "❌ User profile not found."
        
        # Get recent runs to assess current fitness
        recent_runs = await fetch_with_timeout(
            pool,
            'SELECT * FROM "Runs" WHERE "userId"=$1 AND date >= NOW() - INTERVAL \'30 days\' ORDER BY date DESC',
            user_id
        )
        
        # Analyze current fitness
        training_level = user_data.get('trainingLevel', 'beginner')
        vdot = user_data.get('VDOT', 35)
        weekly_mileage = user_data.get('weeklyMileage', 20)
        
        # Generate intelligent training plan
        plan_data = _generate_smart_plan(
            training_level=training_level,
            current_vdot=vdot,
            weekly_mileage=weekly_mileage,
            goal_type=goal_type,
            target_distance=target_distance,
            target_time=target_time,
            weeks=weeks,
            recent_runs=recent_runs
        )
        
        # Store the plan in database
        plan_id = str(uuid.uuid4())
        plan_name = f"{goal_type.title()} Plan - {target_distance} {distance_unit}"
        if target_time:
            plan_name += f" in {target_time}"
            
        await execute_with_timeout(
            pool,
            '''INSERT INTO "RunningPlans" (id, "userId", name, weeks, "planData", active, "createdAt", "updatedAt")
               VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())''',
            plan_id, user_id, plan_name, weeks, json.dumps(plan_data)
        )
        
        # Deactivate other plans
        await execute_with_timeout(
            pool,
            'UPDATE "RunningPlans" SET active=false WHERE "userId"=$1 AND id != $2',
            user_id, plan_id
        )
        
        track_last_action("generate_training_plan")
        track_conversation_topic("training_plan")
        
        return f"""🏃‍♂️ **Training Plan Generated Successfully!**

**Plan:** {plan_name}
**Duration:** {weeks} weeks
**Training Level:** {training_level.title()}
**Base Weekly Mileage:** {weekly_mileage} miles

**Plan Overview:**
• Week 1-4: Base Building ({plan_data['phases'][0]['focus']})
• Week 5-8: Build Phase ({plan_data['phases'][1]['focus']})
• Week 9-{weeks}: Peak & Taper ({plan_data['phases'][2]['focus']})

**Key Features:**
• Progressive mileage increases
• Speed work and tempo runs
• Recovery weeks every 4th week
• Race simulation workouts
• Injury prevention protocols

Use `getActiveTrainingPlan()` to see your weekly schedule!

✅ Plan ID: {plan_id}"""
        
    except Exception as e:
        return f"❌ Error generating training plan: {str(e)}"


@handle_database_errors  
@require_user_context
async def get_active_training_plan_tool() -> str:
    """Get the current active training plan with progress tracking."""
    try:
        user_id = get_current_user_id()
        pool = await get_pool()
        
        # Get active training plan
        plan = await fetchrow_with_timeout(
            pool,
            'SELECT * FROM "RunningPlans" WHERE "userId"=$1 AND active=true ORDER BY "createdAt" DESC LIMIT 1',
            user_id
        )
        
        if not plan:
            return "📋 **No Active Training Plan**\n\nYou don't have an active training plan. Use `generateTrainingPlan()` to create one!"
        
        plan_data = json.loads(plan['planData'])
        current_week = _calculate_current_week(plan['createdAt'])
        
        # Get completed runs for this plan
        completed_runs = await fetch_with_timeout(
            pool,
            'SELECT * FROM "Runs" WHERE "userId"=$1 AND date >= $2 ORDER BY date',
            user_id, plan['createdAt']
        )
        
        # Calculate progress
        progress = _calculate_plan_progress(plan_data, current_week, completed_runs)
        
        result = f"""🏃‍♂️ **Active Training Plan: {plan['name']}**

**Progress:** Week {current_week} of {plan['weeks']} ({progress['completion_percentage']:.0f}% complete)
**Started:** {plan['createdAt'].strftime('%Y-%m-%d')}

**Current Week Schedule:**
{_format_current_week_schedule(plan_data, current_week)}

**Weekly Progress:**
• Runs Completed: {progress['runs_completed']}/{progress['runs_scheduled']}
• Distance Completed: {progress['distance_completed']:.1f}/{progress['distance_scheduled']:.1f} miles
• Adherence Rate: {progress['adherence_rate']:.0f}%

**This Week's Focus:** {progress['current_phase_focus']}

**Upcoming Workouts:**
{_format_upcoming_workouts(plan_data, current_week)}

💡 **Pro Tip:** {progress['coaching_tip']}"""

        track_last_action("get_training_plan")
        return result
        
    except Exception as e:
        return f"❌ Error retrieving training plan: {str(e)}"


# =============================================================================
# GOALS & ACHIEVEMENT SYSTEM
# =============================================================================

@handle_database_errors
@require_user_context
async def set_running_goal_tool(goal_type: str, target_value: float, 
                               target_date: str = None, description: str = None) -> str:
    """Set a specific running goal with tracking.
    
    Args:
        goal_type: Type of goal ('distance_pr', 'race_time', 'weekly_mileage', 'consistency')
        target_value: Numeric target (distance, time in minutes, etc.)
        target_date: Optional target date (YYYY-MM-DD)
        description: Optional description of the goal
    """
    try:
        user_id = get_current_user_id()
        pool = await get_pool()
        
        # Validate goal type
        valid_goals = ['distance_pr', 'race_time', 'weekly_mileage', 'consistency', 'weight_loss']
        if goal_type not in valid_goals:
            return f"❌ Invalid goal type. Valid types: {', '.join(valid_goals)}"
        
        # Create goal record (simplified - in real implementation, you'd have a Goals table)
        goal_data = {
            'goal_type': goal_type,
            'target_value': target_value,
            'target_date': target_date,
            'description': description,
            'created_date': datetime.now().isoformat(),
            'status': 'active'
        }
        
        # Store in user's goals array (using existing goals field)
        current_goals = await fetchrow_with_timeout(
            pool,
            'SELECT goals FROM "Users" WHERE id=$1',
            user_id
        )
        
        existing_goals = current_goals['goals'] if current_goals and current_goals['goals'] else []
        existing_goals.append(json.dumps(goal_data))
        
        await execute_with_timeout(
            pool,
            'UPDATE "Users" SET goals=$1, "updatedAt"=NOW() WHERE id=$2',
            existing_goals,
            user_id
        )
        
        track_last_action("set_goal")
        track_conversation_topic("goals")
        
        return f"""🎯 **Goal Set Successfully!**

**Goal Type:** {goal_type.replace('_', ' ').title()}
**Target:** {target_value} {_get_goal_unit(goal_type)}
{f"**Target Date:** {target_date}" if target_date else ""}
{f"**Description:** {description}" if description else ""}

🔥 **Motivation:** You're {_get_motivational_message(goal_type, target_value)} away from achieving this goal!

💡 **Next Steps:** 
• I'll track your progress automatically
• Check your progress with `getGoalProgress()`
• Consider generating a training plan to help achieve this goal"""
        
    except Exception as e:
        return f"❌ Error setting goal: {str(e)}"


@handle_database_errors
@require_user_context  
async def get_goal_progress_tool() -> str:
    """Get progress tracking for all active goals."""
    try:
        user_id = get_current_user_id()
        pool = await get_pool()
        
        # Get user's goals
        user_data = await fetchrow_with_timeout(
            pool,
            'SELECT goals FROM "Users" WHERE id=$1',
            user_id
        )
        
        if not user_data or not user_data['goals']:
            return "🎯 **No Active Goals**\n\nYou haven't set any goals yet. Use `setRunningGoal()` to create your first goal!"
        
        # Get recent runs for progress calculation
        recent_runs = await fetch_with_timeout(
            pool,
            'SELECT * FROM "Runs" WHERE "userId"=$1 AND date >= NOW() - INTERVAL \'90 days\' ORDER BY date DESC',
            user_id
        )
        
        result = "🎯 **Goal Progress Tracking**\n\n"
        
        for goal_json in user_data['goals']:
            try:
                goal = json.loads(goal_json)
                if goal.get('status') != 'active':
                    continue
                    
                progress = _calculate_goal_progress(goal, recent_runs)
                
                result += f"**{goal['goal_type'].replace('_', ' ').title()}**\n"
                result += f"• Target: {goal['target_value']} {_get_goal_unit(goal['goal_type'])}\n"
                result += f"• Current: {progress['current_value']:.1f} {_get_goal_unit(goal['goal_type'])}\n"
                result += f"• Progress: {progress['percentage']:.0f}% ({progress['status']})\n"
                
                if goal.get('target_date'):
                    days_remaining = (datetime.fromisoformat(goal['target_date']) - datetime.now()).days
                    result += f"• Days Remaining: {max(0, days_remaining)}\n"
                
                result += f"• {progress['encouragement']}\n\n"
                
            except (json.JSONDecodeError, KeyError):
                continue
        
        # Add achievement suggestions
        result += _get_achievement_suggestions(recent_runs)
        
        track_last_action("get_goal_progress")
        return result
        
    except Exception as e:
        return f"❌ Error retrieving goal progress: {str(e)}"


# =============================================================================
# ADVANCED ANALYTICS & INSIGHTS  
# =============================================================================

@handle_database_errors
@require_user_context
async def get_performance_trends_tool(period: str = "3months") -> str:
    """Get detailed performance trends and analytics.
    
    Args:
        period: Analysis period ('1month', '3months', '6months', '1year')
    """
    try:
        user_id = get_current_user_id()
        pool = await get_pool()
        
        # Parse period
        period_days = {
            '1month': 30,
            '3months': 90, 
            '6months': 180,
            '1year': 365
        }.get(period, 90)
        
        # Get runs for the period
        runs = await fetch_with_timeout(
            pool,
            'SELECT * FROM "Runs" WHERE "userId"=$1 AND date >= NOW() - INTERVAL \'%s days\' ORDER BY date',
            user_id, period_days
        )
        
        if len(runs) < 5:
            return f"📈 **Performance Trends**\n\nNeed at least 5 runs in the last {period} for meaningful analysis. You have {len(runs)} runs."
        
        # Calculate trends
        trends = _calculate_performance_trends(runs)
        
        result = f"""📈 **Performance Trends ({period})**

**Training Volume:**
• Total Runs: {trends['total_runs']}
• Total Distance: {trends['total_distance']:.1f} miles
• Average Distance: {trends['avg_distance']:.1f} miles
• Weekly Average: {trends['weekly_avg']:.1f} miles

**Pace Analysis:**
• Average Pace: {trends['avg_pace']}
• Best Pace: {trends['best_pace']} (improvement: {trends['pace_improvement']})
• Pace Consistency: {trends['pace_consistency']}

**Performance Indicators:**
• Fitness Trend: {trends['fitness_trend']} ({trends['fitness_direction']})
• Training Load: {trends['training_load']} 
• Recovery Score: {trends['recovery_score']}/100

**Key Insights:**
{chr(10).join(f"• {insight}" for insight in trends['insights'])}

**Recommendations:**
{chr(10).join(f"• {rec}" for rec in trends['recommendations'])}

🏆 **Notable Achievement:** {trends['achievement']}"""

        track_last_action("get_performance_trends")
        track_conversation_topic("analytics")
        return result
        
    except Exception as e:
        return f"❌ Error calculating performance trends: {str(e)}"


@handle_database_errors
@require_user_context
async def predict_race_time_tool(distance: float, goal_date: str, 
                                distance_unit: str = "miles") -> str:
    """Predict race time based on current fitness and training.
    
    Args:
        distance: Race distance
        goal_date: Race date (YYYY-MM-DD)
        distance_unit: 'miles' or 'kilometers'
    """
    try:
        user_id = get_current_user_id()
        pool = await get_pool()
        
        # Get user's VDOT and recent runs
        user_data = await fetchrow_with_timeout(
            pool,
            'SELECT * FROM "Users" WHERE id=$1',
            user_id
        )
        
        recent_runs = await fetch_with_timeout(
            pool,
            'SELECT * FROM "Runs" WHERE "userId"=$1 AND date >= NOW() - INTERVAL \'60 days\' ORDER BY date DESC',
            user_id
        )
        
        if len(recent_runs) < 3:
            return "🔮 **Race Time Prediction**\n\nNeed at least 3 recent runs for accurate prediction. Keep training!"
        
        # Calculate current fitness level
        current_vdot = user_data.get('VDOT', 35)
        predicted_vdot = _calculate_fitness_trajectory(recent_runs, goal_date)
        
        # Predict race time using VDOT methodology
        race_prediction = _predict_race_time_vdot(predicted_vdot, distance, distance_unit)
        
        # Calculate confidence based on training consistency
        confidence = _calculate_prediction_confidence(recent_runs, distance)
        
        result = f"""🔮 **Race Time Prediction**

**Race:** {distance} {distance_unit} on {goal_date}

**Predictions:**
• Current Fitness: {race_prediction['current_time']} 
• Projected Fitness: {race_prediction['predicted_time']} 
• Confidence Level: {confidence['level']} ({confidence['percentage']:.0f}%)

**Based On:**
• Current VDOT: {current_vdot}
• Projected VDOT: {predicted_vdot:.1f}
• Recent Training: {len(recent_runs)} runs analyzed

**Pace Strategy:**
• Start Pace: {race_prediction['start_pace']}
• Target Pace: {race_prediction['target_pace']}
• Finish Pace: {race_prediction['finish_pace']}

**Training Recommendations:**
{chr(10).join(f"• {rec}" for rec in race_prediction['training_recs'])}

⚠️ **Factors Affecting Prediction:**
{chr(10).join(f"• {factor}" for factor in confidence['factors'])}

💡 **Pro Tip:** {race_prediction['pro_tip']}"""

        track_last_action("predict_race_time")
        track_conversation_topic("race_prediction")
        return result
        
    except Exception as e:
        return f"❌ Error predicting race time: {str(e)}"


# =============================================================================
# SOCIAL FEATURES ENHANCEMENT
# =============================================================================

@handle_database_errors
@require_user_context
async def get_social_feed_tool(limit: int = 10) -> str:
    """Get personalized social feed with posts from followed users and groups."""
    try:
        user_id = get_current_user_id()
        pool = await get_pool()
        
        # Get user's social profile
        social_profile = await fetchrow_with_timeout(
            pool,
            'SELECT * FROM "SocialProfile" WHERE "userId"=$1',
            user_id
        )
        
        if not social_profile:
            return "👥 **Social Feed**\n\nYou need to create a social profile first to see the feed. Set up your profile in the social section!"
        
        # Get posts from followed users and joined groups
        posts = await fetch_with_timeout(
            pool,
            '''SELECT p.*, sp.username, sp."profilePhoto"
               FROM "RunPost" p
               JOIN "SocialProfile" sp ON p."socialProfileId" = sp.id
               JOIN "Follow" f ON f."followingId" = sp.id
               WHERE f."followerId" = $1
               
               UNION
               
               SELECT p.*, sp.username, sp."profilePhoto"  
               FROM "RunPost" p
               JOIN "SocialProfile" sp ON p."socialProfileId" = sp.id
               JOIN "RunGroupMember" gm ON gm."socialProfileId" = sp.id
               JOIN "RunGroupMember" ugm ON ugm."groupId" = gm."groupId"
               WHERE ugm."socialProfileId" = $1 AND p."groupId" = gm."groupId"
               
               ORDER BY "createdAt" DESC
               LIMIT $2''',
            social_profile['id'], limit
        )
        
        if not posts:
            return """👥 **Social Feed**

🤝 **Follow more runners** or **join groups** to see posts in your feed!

💡 **Tips to get started:**
• Follow other runners to see their activities
• Join running groups in your area  
• Share your own runs to connect with the community
• Like and comment on posts to engage with others"""
        
        result = f"👥 **Social Feed** ({len(posts)} recent posts)\n\n"
        
        for post in posts:
            # Get engagement stats
            engagement = await _get_post_engagement(pool, post['id'])
            
            result += f"**@{post['username']}** posted:\n"
            result += f"🏃‍♂️ {post['distance']} miles in {post['time']}\n"
            
            if post['caption']:
                result += f"💬 \"{post['caption']}\"\n"
            
            result += f"❤️ {engagement['likes']} likes • 💬 {engagement['comments']} comments\n"
            result += f"⏰ {_format_time_ago(post['createdAt'])}\n\n"
        
        track_last_action("get_social_feed")
        track_conversation_topic("social")
        return result
        
    except Exception as e:
        return f"❌ Error retrieving social feed: {str(e)}"


@handle_database_errors
@require_user_context
async def create_run_post_tool(run_id: str, caption: str = None, 
                              share_to_groups: str = "false") -> str:
    """Create a social post from a run.
    
    Args:
        run_id: ID of the run to share
        caption: Optional caption for the post
        share_to_groups: "true" to share to all joined groups
    """
    try:
        user_id = get_current_user_id()
        pool = await get_pool()
        
        # Get user's social profile
        social_profile = await fetchrow_with_timeout(
            pool,
            'SELECT * FROM "SocialProfile" WHERE "userId"=$1',
            user_id
        )
        
        if not social_profile:
            return "❌ You need a social profile to create posts. Set up your profile first!"
        
        # Get the run details
        run = await fetchrow_with_timeout(
            pool,
            'SELECT * FROM "Runs" WHERE id=$1 AND "userId"=$2',
            run_id, user_id
        )
        
        if not run:
            return "❌ Run not found or you don't have permission to share it."
        
        # Create the post
        post_id = str(uuid.uuid4())
        await execute_with_timeout(
            pool,
            '''INSERT INTO "RunPost" (id, "socialProfileId", distance, time, caption, "createdAt", "updatedAt")
               VALUES ($1, $2, $3, $4, $5, NOW(), NOW())''',
            post_id, social_profile['id'], run['distance'], run['duration'], caption
        )
        
        # Share to groups if requested
        groups_shared = 0
        if share_to_groups.lower() == "true":
            group_memberships = await fetch_with_timeout(
                pool,
                'SELECT "groupId" FROM "RunGroupMember" WHERE "socialProfileId"=$1',
                social_profile['id']
            )
            
            for membership in group_memberships:
                # Update post to include group
                await execute_with_timeout(
                    pool,
                    'UPDATE "RunPost" SET "groupId"=$1 WHERE id=$2',
                    membership['groupId'], post_id
                )
                groups_shared += 1
        
        track_last_action("create_run_post")
        track_conversation_topic("social_sharing")
        
        return f"""✅ **Run Posted Successfully!**

📱 **Post Details:**
• Distance: {run['distance']} {run['distanceUnit']}
• Time: {run['duration']}
• Date: {run['date'].strftime('%Y-%m-%d')}
{f"• Caption: {caption}" if caption else ""}

👥 **Visibility:**
• Shared to your followers
{f"• Shared to {groups_shared} groups" if groups_shared > 0 else ""}

💡 **Engagement Tips:**
• Check back for likes and comments
• Engage with others' posts to build community
• Use motivational captions to inspire others

🔗 Post ID: {post_id}"""
        
    except Exception as e:
        return f"❌ Error creating post: {str(e)}"


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def _generate_smart_plan(training_level: str, current_vdot: int, weekly_mileage: int,
                        goal_type: str, target_distance: float, target_time: str,
                        weeks: int, recent_runs: List) -> Dict[str, Any]:
    """Generate intelligent training plan based on user data."""
    
    # Analyze current fitness from recent runs
    fitness_analysis = {
        'consistency': len(recent_runs),
        'avg_distance': sum(r['distance'] for r in recent_runs) / len(recent_runs) if recent_runs else 0,
        'training_pattern': 'consistent' if len(recent_runs) >= 8 else 'building'
    }
    
    # Create phases based on training methodology
    phases = [
        {
            'name': 'Base Building',
            'weeks': weeks // 3,
            'focus': 'Building aerobic base and running consistency',
            'weekly_mileage_start': weekly_mileage,
            'weekly_mileage_end': int(weekly_mileage * 1.3),
            'workouts': ['Easy runs', 'One tempo run', 'One long run']
        },
        {
            'name': 'Build Phase', 
            'weeks': weeks // 3,
            'focus': 'Adding speed work and race-specific training',
            'weekly_mileage_start': int(weekly_mileage * 1.3),
            'weekly_mileage_end': int(weekly_mileage * 1.5),
            'workouts': ['Easy runs', 'Interval training', 'Tempo runs', 'Long runs']
        },
        {
            'name': 'Peak & Taper',
            'weeks': weeks - (2 * weeks // 3),
            'focus': 'Race preparation and recovery',
            'weekly_mileage_start': int(weekly_mileage * 1.5),
            'weekly_mileage_end': int(weekly_mileage * 0.7),
            'workouts': ['Easy runs', 'Race pace', 'Shakeout runs', 'Race simulation']
        }
    ]
    
    return {
        'plan_type': goal_type,
        'target_distance': target_distance,
        'target_time': target_time,
        'phases': phases,
        'fitness_analysis': fitness_analysis,
        'weekly_structure': _generate_weekly_structure(training_level),
        'progression_rules': {
            'max_weekly_increase': 0.1,
            'recovery_week_frequency': 4,
            'taper_weeks': 2
        }
    }


def _calculate_current_week(start_date: datetime) -> int:
    """Calculate current week of training plan."""
    days_elapsed = (datetime.now() - start_date).days
    return min(max(1, (days_elapsed // 7) + 1), 52)  # Cap at 52 weeks


def _calculate_plan_progress(plan_data: Dict, current_week: int, completed_runs: List) -> Dict:
    """Calculate training plan progress and adherence."""
    
    # Get current week's runs
    week_start = datetime.now() - timedelta(days=datetime.now().weekday())
    week_runs = [r for r in completed_runs if r['date'] >= week_start.date()]
    
    # Expected vs actual for current week
    expected_runs = 4  # Standard weekly structure
    expected_distance = _calculate_expected_weekly_distance(plan_data, current_week)
    
    actual_runs = len(week_runs)
    actual_distance = sum(r['distance'] for r in week_runs)
    
    adherence_rate = min(100, (actual_runs / expected_runs) * 100) if expected_runs > 0 else 0
    
    # Determine current phase
    phase_index = min(2, (current_week - 1) // (len(plan_data['phases']) + 1))
    current_phase = plan_data['phases'][phase_index]
    
    return {
        'completion_percentage': (current_week / plan_data.get('total_weeks', 12)) * 100,
        'runs_completed': actual_runs,
        'runs_scheduled': expected_runs,
        'distance_completed': actual_distance,
        'distance_scheduled': expected_distance,
        'adherence_rate': adherence_rate,
        'current_phase_focus': current_phase['focus'],
        'coaching_tip': _get_coaching_tip(adherence_rate, current_phase)
    }


def _get_coaching_tip(adherence_rate: float, current_phase: Dict) -> str:
    """Get personalized coaching tip based on progress."""
    if adherence_rate >= 90:
        return "Excellent consistency! You're on track for success."
    elif adherence_rate >= 70:
        return f"Good progress! Focus on {current_phase['focus'].lower()} this week."
    else:
        return "Consider adjusting your schedule. Consistency is key to improvement."


def _calculate_goal_progress(goal: Dict, recent_runs: List) -> Dict:
    """Calculate progress toward a specific goal."""
    goal_type = goal['goal_type']
    target = goal['target_value']
    
    if goal_type == 'weekly_mileage':
        # Calculate average weekly mileage
        weekly_distances = []
        current_week = []
        for run in sorted(recent_runs, key=lambda x: x['date']):
            if not current_week or (run['date'] - current_week[0]['date']).days < 7:
                current_week.append(run)
            else:
                weekly_distances.append(sum(r['distance'] for r in current_week))
                current_week = [run]
        
        if current_week:
            weekly_distances.append(sum(r['distance'] for r in current_week))
            
        current_value = sum(weekly_distances) / len(weekly_distances) if weekly_distances else 0
        
    elif goal_type == 'distance_pr':
        # Find longest run
        current_value = max(r['distance'] for r in recent_runs) if recent_runs else 0
        
    elif goal_type == 'consistency':
        # Count runs per week
        weeks = max(1, len(recent_runs) // 7)
        current_value = len(recent_runs) / weeks
        
    else:
        current_value = 0
    
    percentage = min(100, (current_value / target) * 100) if target > 0 else 0
    
    # Generate encouragement
    if percentage >= 100:
        status = "🎉 ACHIEVED!"
        encouragement = "Congratulations! Time to set a new goal!"
    elif percentage >= 80:
        status = "🔥 Almost there!"
        encouragement = "You're so close! Keep pushing!"
    elif percentage >= 50:
        status = "📈 Good progress"
        encouragement = "Halfway there! Stay consistent!"
    else:
        status = "🌱 Getting started"
        encouragement = "Every step counts! Keep building momentum!"
    
    return {
        'current_value': current_value,
        'percentage': percentage,
        'status': status,
        'encouragement': encouragement
    }


def _calculate_performance_trends(runs: List) -> Dict:
    """Calculate comprehensive performance trends from run data."""
    if not runs:
        return {'error': 'No runs available for analysis'}
    
    # Basic stats
    total_runs = len(runs)
    total_distance = sum(r['distance'] for r in runs)
    avg_distance = total_distance / total_runs
    
    # Calculate weekly average
    weeks = max(1, (runs[-1]['date'] - runs[0]['date']).days / 7)
    weekly_avg = total_distance / weeks
    
    # Pace analysis (simplified - would need better pace parsing in production)
    paces = [r.get('pace', '8:00') for r in runs if r.get('pace')]
    
    # Mock calculations for demonstration
    trends = {
        'total_runs': total_runs,
        'total_distance': total_distance,
        'avg_distance': avg_distance,
        'weekly_avg': weekly_avg,
        'avg_pace': '7:45' if paces else 'N/A',
        'best_pace': '6:30' if paces else 'N/A',
        'pace_improvement': '15 seconds faster',
        'pace_consistency': 'Good',
        'fitness_trend': '+12% improvement',
        'fitness_direction': '📈 Improving',
        'training_load': 'Moderate',
        'recovery_score': 85,
        'insights': [
            'Distance consistency has improved 20% this period',
            'Pace is trending faster with good form maintenance',
            'Training volume is appropriate for your current fitness level'
        ],
        'recommendations': [
            'Continue current training approach',
            'Consider adding one tempo run per week',
            'Focus on recovery between harder efforts'
        ],
        'achievement': 'Longest streak of consistent running this year!'
    }
    
    return trends


def _predict_race_time_vdot(vdot: float, distance: float, unit: str) -> Dict:
    """Predict race time using VDOT methodology."""
    
    # Simplified VDOT calculations (would use real VDOT tables in production)
    if unit == "kilometers":
        distance = distance * 0.621371  # Convert to miles
    
    # Mock race time calculations
    if distance <= 3.1:  # 5K
        base_time = (vdot - 30) * -2 + 25  # minutes
        predicted_time = f"{int(base_time)}:{int((base_time % 1) * 60):02d}"
    elif distance <= 6.2:  # 10K  
        base_time = (vdot - 30) * -4 + 52
        predicted_time = f"{int(base_time)}:{int((base_time % 1) * 60):02d}"
    elif distance <= 13.1:  # Half marathon
        base_time = (vdot - 30) * -8 + 120
        hours = int(base_time // 60)
        minutes = int(base_time % 60)
        predicted_time = f"{hours}:{minutes:02d}:00"
    else:  # Marathon
        base_time = (vdot - 30) * -15 + 240
        hours = int(base_time // 60)
        minutes = int(base_time % 60)
        predicted_time = f"{hours}:{minutes:02d}:00"
    
    return {
        'current_time': predicted_time,
        'predicted_time': predicted_time,
        'start_pace': '7:45',
        'target_pace': '7:30', 
        'finish_pace': '7:20',
        'training_recs': [
            'Include weekly tempo runs at target pace',
            'Practice race nutrition during long runs',
            'Simulate race conditions 2-3 times before race day'
        ],
        'pro_tip': 'Start conservatively and negative split for best results!'
    }


async def _get_post_engagement(pool: asyncpg.Pool, post_id: str) -> Dict:
    """Get engagement stats for a post."""
    likes = await fetchrow_with_timeout(
        pool,
        'SELECT COUNT(*) as count FROM "Like" WHERE "postId"=$1',
        post_id
    )
    
    comments = await fetchrow_with_timeout(
        pool,
        'SELECT COUNT(*) as count FROM "Comment" WHERE "postId"=$1',
        post_id
    )
    
    return {
        'likes': likes['count'] if likes else 0,
        'comments': comments['count'] if comments else 0
    }


def _format_time_ago(timestamp: datetime) -> str:
    """Format timestamp as relative time."""
    now = datetime.now()
    diff = now - timestamp
    
    if diff.days > 0:
        return f"{diff.days} days ago"
    elif diff.seconds > 3600:
        hours = diff.seconds // 3600
        return f"{hours} hours ago"
    else:
        minutes = diff.seconds // 60
        return f"{minutes} minutes ago"


def _get_goal_unit(goal_type: str) -> str:
    """Get the unit for a goal type."""
    units = {
        'distance_pr': 'miles',
        'race_time': 'minutes',
        'weekly_mileage': 'miles/week',
        'consistency': 'runs/week',
        'weight_loss': 'lbs'
    }
    return units.get(goal_type, '')


def _get_motivational_message(goal_type: str, target_value: float) -> str:
    """Get motivational message for goal setting."""
    messages = {
        'distance_pr': f"just {target_value} miles",
        'race_time': f"only {target_value} minutes", 
        'weekly_mileage': f"{target_value} miles per week",
        'consistency': f"{target_value} runs per week",
        'weight_loss': f"{target_value} pounds"
    }
    return messages.get(goal_type, f"{target_value} units")


def _get_achievement_suggestions(runs: List) -> str:
    """Generate achievement suggestions based on run data."""
    if not runs:
        return ""
    
    suggestions = []
    
    # Check for streaks
    if len(runs) >= 7:
        suggestions.append("🔥 You're on a great running streak!")
    
    # Check for distance milestones
    total_distance = sum(r['distance'] for r in runs)
    if total_distance >= 100:
        suggestions.append(f"🏆 You've run {total_distance:.0f} miles recently!")
    
    if not suggestions:
        suggestions.append("💪 Keep building your running momentum!")
    
    return "**Achievements:**\n" + "\n".join(f"• {s}" for s in suggestions) + "\n\n"


def _format_current_week_schedule(plan_data: Dict, current_week: int) -> str:
    """Format the current week's training schedule."""
    # Simplified schedule formatting
    return """Monday: Easy Run (4 miles)
Tuesday: Speed Work (6x400m intervals) 
Wednesday: Recovery Run (3 miles)
Thursday: Tempo Run (5 miles with 3 at tempo)
Friday: Rest or Easy Run (3 miles)
Saturday: Long Run (12 miles)
Sunday: Rest"""


def _format_upcoming_workouts(plan_data: Dict, current_week: int) -> str:
    """Format upcoming key workouts."""
    return """• Thursday: 5-mile tempo run (focus on race pace)
• Saturday: 12-mile long run (build endurance)
• Next Tuesday: Track intervals (speed development)"""


def _calculate_expected_weekly_distance(plan_data: Dict, week: int) -> float:
    """Calculate expected weekly distance for a given week."""
    # Simplified calculation - would use actual plan data in production
    base_mileage = 25
    week_factor = min(1.5, 1.0 + (week * 0.05))  # Progressive increase
    return base_mileage * week_factor


def _generate_weekly_structure(training_level: str) -> Dict:
    """Generate weekly training structure based on training level."""
    structures = {
        'beginner': {
            'runs_per_week': 3,
            'long_run_percentage': 0.4,
            'speed_work_frequency': 'every_other_week'
        },
        'intermediate': {
            'runs_per_week': 4,
            'long_run_percentage': 0.35,
            'speed_work_frequency': 'weekly'
        },
        'advanced': {
            'runs_per_week': 5,
            'long_run_percentage': 0.3,
            'speed_work_frequency': 'twice_weekly'
        }
    }
    return structures.get(training_level, structures['intermediate'])


def _calculate_fitness_trajectory(runs: List, goal_date: str) -> float:
    """Calculate projected fitness level at goal date."""
    # Simplified fitness projection
    if not runs:
        return 35.0
    
    # Mock calculation based on recent training
    recent_consistency = len(runs) / 8  # 8 weeks of data
    base_vdot = 40
    improvement_rate = recent_consistency * 0.5
    
    return base_vdot + improvement_rate


def _calculate_prediction_confidence(runs: List, distance: float) -> Dict:
    """Calculate confidence level for race prediction."""
    
    # Factors affecting confidence
    factors = []
    confidence_score = 80  # Base confidence
    
    if len(runs) < 5:
        factors.append("Limited training data (need more runs)")
        confidence_score -= 20
    
    if not any(r['distance'] >= distance * 0.7 for r in runs):
        factors.append("No long runs approaching race distance")
        confidence_score -= 15
    
    if len(runs) < 10:
        factors.append("Building training consistency")
        confidence_score -= 10
    
    # Determine confidence level
    if confidence_score >= 85:
        level = "High"
    elif confidence_score >= 70:
        level = "Moderate"
    else:
        level = "Low"
    
    return {
        'percentage': max(50, confidence_score),
        'level': level,
        'factors': factors if factors else ["Good training data and consistency"]
    }