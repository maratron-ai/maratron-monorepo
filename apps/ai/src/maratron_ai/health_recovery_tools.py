"""Health & Recovery MCP Tools for Injury Prevention and Performance Optimization

This module provides sophisticated tools for health monitoring, injury prevention,
recovery analysis, and training load management.
"""

import json
import uuid
import asyncpg
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
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
# HEALTH & RECOVERY ANALYSIS TOOLS
# =============================================================================

@handle_database_errors
@require_user_context
async def analyze_injury_risk_tool(time_period: str = "4weeks") -> str:
    """Analyze injury risk based on training load, patterns, and history.
    
    Args:
        time_period: Period to analyze ('2weeks', '4weeks', '8weeks', '12weeks')
    """
    try:
        user_id = get_current_user_id()
        pool = await get_pool()
        
        # Get user profile with injury history
        user_data = await fetchrow_with_timeout(
            pool,
            'SELECT * FROM "Users" WHERE id=$1',
            user_id
        )
        
        if not user_data:
            return "❌ User profile not found."
        
        # Calculate time period
        period_map = {
            '2weeks': 14, '4weeks': 28, '8weeks': 56, '12weeks': 84
        }
        days = period_map.get(time_period, 28)
        start_date = datetime.now() - timedelta(days=days)
        
        # Get recent runs for analysis
        recent_runs = await fetch_with_timeout(
            pool,
            'SELECT * FROM "Runs" WHERE "userId"=$1 AND date >= $2 ORDER BY date DESC',
            user_id, start_date
        )
        
        if len(recent_runs) < 3:
            return f"🏥 Injury Risk Analysis ({time_period})\n\n" + \
                   "Need at least 3 runs in the selected period for meaningful analysis.\n" + \
                   "Record more runs to get personalized injury risk insights."
        
        # Analyze training load and patterns
        risk_analysis = _analyze_training_load_risk(recent_runs, user_data)
        injury_history_risk = _analyze_injury_history_risk(user_data)
        pattern_risks = _analyze_training_pattern_risks(recent_runs)
        
        # Generate comprehensive analysis
        return _format_injury_risk_analysis(
            risk_analysis, injury_history_risk, pattern_risks, time_period, len(recent_runs)
        )
        
    except Exception as e:
        return f"Error analyzing injury risk: {str(e)}"


@handle_database_errors
@require_user_context
async def get_recovery_recommendations_tool(focus_area: str = "general") -> str:
    """Get personalized recovery recommendations based on recent training.
    
    Args:
        focus_area: Focus area ('general', 'legs', 'aerobic', 'strength', 'flexibility')
    """
    try:
        user_id = get_current_user_id()
        pool = await get_pool()
        
        # Get user profile
        user_data = await fetchrow_with_timeout(
            pool,
            'SELECT * FROM "Users" WHERE id=$1',
            user_id
        )
        
        # Get recent runs (last 2 weeks)
        recent_runs = await fetch_with_timeout(
            pool,
            'SELECT * FROM "Runs" WHERE "userId"=$1 AND date >= NOW() - INTERVAL \'14 days\' ORDER BY date DESC',
            user_id
        )
        
        if not recent_runs:
            return f"🔄 Recovery Recommendations ({focus_area.title()})\n\n" + \
                   "No recent runs found. Record some runs to get personalized recovery advice.\n" + \
                   "Recovery is crucial for improvement and injury prevention!"
        
        # Analyze recent training stress
        training_stress = _calculate_training_stress(recent_runs)
        recovery_needs = _assess_recovery_needs(recent_runs, user_data, focus_area)
        
        return _format_recovery_recommendations(recovery_needs, training_stress, focus_area)
        
    except Exception as e:
        return f"Error generating recovery recommendations: {str(e)}"


@handle_database_errors
@require_user_context
async def analyze_training_load_tool(period: str = "4weeks") -> str:
    """Analyze training load progression and provide optimization recommendations.
    
    Args:
        period: Analysis period ('2weeks', '4weeks', '8weeks', '12weeks')
    """
    try:
        user_id = get_current_user_id()
        pool = await get_pool()
        
        # Calculate time period
        period_map = {
            '2weeks': 14, '4weeks': 28, '8weeks': 56, '12weeks': 84
        }
        days = period_map.get(period, 28)
        start_date = datetime.now() - timedelta(days=days)
        
        # Get runs for analysis
        runs = await fetch_with_timeout(
            pool,
            'SELECT * FROM "Runs" WHERE "userId"=$1 AND date >= $2 ORDER BY date ASC',
            user_id, start_date
        )
        
        if len(runs) < 5:
            return f"📊 Training Load Analysis ({period})\n\n" + \
                   "Need at least 5 runs for meaningful load analysis.\n" + \
                   "Continue recording runs to track your training progression!"
        
        # Analyze training load progression
        load_analysis = _analyze_load_progression(runs)
        weekly_trends = _analyze_weekly_load_trends(runs)
        recommendations = _generate_load_recommendations(load_analysis, weekly_trends)
        
        return _format_training_load_analysis(load_analysis, weekly_trends, recommendations, period)
        
    except Exception as e:
        return f"Error analyzing training load: {str(e)}"


@handle_database_errors
@require_user_context
async def get_health_insights_tool() -> str:
    """Get comprehensive health insights based on training patterns and user profile."""
    try:
        user_id = get_current_user_id()
        pool = await get_pool()
        
        # Get user profile
        user_data = await fetchrow_with_timeout(
            pool,
            'SELECT * FROM "Users" WHERE id=$1',
            user_id
        )
        
        # Get recent runs (last 6 weeks)
        recent_runs = await fetch_with_timeout(
            pool,
            'SELECT * FROM "Runs" WHERE "userId"=$1 AND date >= NOW() - INTERVAL \'42 days\' ORDER BY date DESC',
            user_id
        )
        
        if not user_data:
            return "❌ User profile not found."
        
        if len(recent_runs) < 3:
            return "🏥 Health Insights\n\n" + \
                   "Record more runs to get comprehensive health insights.\n" + \
                   "We need at least 3 recent runs to analyze your health patterns."
        
        # Generate health insights
        fitness_trends = _analyze_fitness_trends(recent_runs)
        consistency_insights = _analyze_training_consistency(recent_runs)
        health_recommendations = _generate_health_recommendations(user_data, recent_runs)
        
        return _format_health_insights(fitness_trends, consistency_insights, health_recommendations, user_data)
        
    except Exception as e:
        return f"Error generating health insights: {str(e)}"


# =============================================================================
# ANALYSIS HELPER FUNCTIONS
# =============================================================================

def _analyze_training_load_risk(runs: List[Dict], user_data: Dict) -> Dict:
    """Analyze injury risk based on training load patterns."""
    if not runs:
        return {'risk_level': 'unknown', 'factors': []}
    
    # Calculate weekly mileage progression
    weekly_distances = []
    current_week_distance = 0
    current_week_start = None
    
    for run in runs:
        run_date = run['date']
        if current_week_start is None:
            current_week_start = run_date
            current_week_distance = run['distance']
        elif (run_date - current_week_start).days < 7:
            current_week_distance += run['distance']
        else:
            weekly_distances.append(current_week_distance)
            current_week_start = run_date
            current_week_distance = run['distance']
    
    if current_week_distance > 0:
        weekly_distances.append(current_week_distance)
    
    # Analyze progression rate
    risk_factors = []
    risk_level = 'low'
    
    if len(weekly_distances) >= 2:
        # Check for rapid increases (>10% week-over-week)
        for i in range(1, len(weekly_distances)):
            if weekly_distances[i-1] > 0:
                increase = (weekly_distances[i] - weekly_distances[i-1]) / weekly_distances[i-1]
                if increase > 0.15:  # >15% increase
                    risk_factors.append('Rapid mileage increase detected')
                    risk_level = 'high'
                elif increase > 0.10:  # >10% increase
                    risk_factors.append('Moderate mileage increase')
                    risk_level = 'moderate' if risk_level == 'low' else risk_level
    
    # Check for high training frequency
    if len(runs) > 0:
        days_span = (runs[0]['date'] - runs[-1]['date']).days + 1
        runs_per_week = (len(runs) / days_span) * 7
        if runs_per_week > 6:
            risk_factors.append('High training frequency (>6 runs/week)')
            risk_level = 'moderate' if risk_level == 'low' else risk_level
    
    # Check for lack of rest days
    consecutive_days = 0
    max_consecutive = 0
    last_date = None
    
    for run in reversed(runs):
        if last_date and (run['date'] - last_date).days == 1:
            consecutive_days += 1
        else:
            max_consecutive = max(max_consecutive, consecutive_days)
            consecutive_days = 1
        last_date = run['date']
    
    max_consecutive = max(max_consecutive, consecutive_days)
    
    if max_consecutive > 7:
        risk_factors.append(f'Long consecutive training streak ({max_consecutive} days)')
        risk_level = 'high'
    elif max_consecutive > 5:
        risk_factors.append(f'Extended training without rest ({max_consecutive} days)')
        risk_level = 'moderate' if risk_level == 'low' else risk_level
    
    return {
        'risk_level': risk_level,
        'factors': risk_factors,
        'weekly_distances': weekly_distances,
        'max_consecutive_days': max_consecutive
    }


def _analyze_injury_history_risk(user_data: Dict) -> Dict:
    """Analyze injury risk based on user's injury history."""
    injury_history = user_data.get('injuryHistory', '')
    
    risk_factors = []
    risk_level = 'low'
    
    if injury_history:
        # Look for common injury patterns
        lower_case_history = injury_history.lower()
        
        high_risk_injuries = ['stress fracture', 'plantar fasciitis', 'it band', 'achilles']
        moderate_risk_injuries = ['shin splints', 'knee pain', 'hip pain', 'calf strain']
        
        for injury in high_risk_injuries:
            if injury in lower_case_history:
                risk_factors.append(f'History of {injury}')
                risk_level = 'high'
        
        for injury in moderate_risk_injuries:
            if injury in lower_case_history and risk_level == 'low':
                risk_factors.append(f'History of {injury}')
                risk_level = 'moderate'
    
    return {
        'risk_level': risk_level,
        'factors': risk_factors,
        'has_history': bool(injury_history)
    }


def _analyze_training_pattern_risks(runs: List[Dict]) -> Dict:
    """Analyze training patterns for injury risk factors."""
    if not runs:
        return {'risk_level': 'unknown', 'factors': []}
    
    risk_factors = []
    risk_level = 'low'
    
    # Check for surface variety
    environments = [run.get('trainingEnvironment', 'outdoor') for run in runs]
    outdoor_ratio = environments.count('outdoor') / len(environments)
    
    if outdoor_ratio < 0.3:  # Less than 30% outdoor
        risk_factors.append('Limited surface variety (mostly indoor/treadmill)')
        risk_level = 'moderate' if risk_level == 'low' else risk_level
    
    # Check for pace variety
    paces = [run.get('pace') for run in runs if run.get('pace')]
    if len(paces) > 3:
        # Simple pace variety check - could be more sophisticated
        unique_pace_categories = len(set(paces))
        if unique_pace_categories < 2:
            risk_factors.append('Limited pace variety in training')
            risk_level = 'moderate' if risk_level == 'low' else risk_level
    
    return {
        'risk_level': risk_level,
        'factors': risk_factors,
        'outdoor_ratio': outdoor_ratio
    }


def _calculate_training_stress(runs: List[Dict]) -> Dict:
    """Calculate training stress metrics."""
    if not runs:
        return {'stress_level': 'unknown', 'metrics': {}}
    
    # Calculate total distance and frequency
    total_distance = sum(run['distance'] for run in runs)
    days_span = (runs[0]['date'] - runs[-1]['date']).days + 1
    weekly_distance = (total_distance / days_span) * 7
    frequency = len(runs) / (days_span / 7)
    
    # Simple stress calculation
    stress_level = 'low'
    if weekly_distance > 50 or frequency > 6:
        stress_level = 'high'
    elif weekly_distance > 30 or frequency > 4:
        stress_level = 'moderate'
    
    return {
        'stress_level': stress_level,
        'metrics': {
            'weekly_distance': round(weekly_distance, 1),
            'frequency': round(frequency, 1),
            'total_runs': len(runs),
            'days_span': days_span
        }
    }


def _assess_recovery_needs(runs: List[Dict], user_data: Dict, focus_area: str) -> Dict:
    """Assess specific recovery needs based on training and focus area."""
    training_stress = _calculate_training_stress(runs)
    
    # Base recovery recommendations
    recovery_needs = {
        'priority': 'medium',
        'focus_areas': [],
        'activities': [],
        'duration': '1-2 days'
    }
    
    # Adjust based on training stress
    if training_stress['stress_level'] == 'high':
        recovery_needs['priority'] = 'high'
        recovery_needs['duration'] = '2-3 days'
    elif training_stress['stress_level'] == 'low':
        recovery_needs['priority'] = 'low'
        recovery_needs['duration'] = '1 day'
    
    # Focus area specific recommendations
    if focus_area == 'legs':
        recovery_needs['focus_areas'] = ['Lower body', 'Muscle recovery']
        recovery_needs['activities'] = ['Foam rolling', 'Leg elevation', 'Gentle stretching', 'Ice bath']
    elif focus_area == 'aerobic':
        recovery_needs['focus_areas'] = ['Cardiovascular recovery', 'Active recovery']
        recovery_needs['activities'] = ['Easy walking', 'Swimming', 'Cycling (easy)', 'Deep breathing']
    elif focus_area == 'strength':
        recovery_needs['focus_areas'] = ['Muscle repair', 'Strength maintenance']
        recovery_needs['activities'] = ['Protein intake', 'Sleep optimization', 'Light resistance work']
    elif focus_area == 'flexibility':
        recovery_needs['focus_areas'] = ['Mobility', 'Range of motion']
        recovery_needs['activities'] = ['Yoga', 'Dynamic stretching', 'Massage', 'Mobility work']
    else:  # general
        recovery_needs['focus_areas'] = ['Overall recovery', 'Adaptation']
        recovery_needs['activities'] = ['Rest', 'Sleep', 'Hydration', 'Nutrition']
    
    return recovery_needs


def _analyze_load_progression(runs: List[Dict]) -> Dict:
    """Analyze training load progression over time."""
    if not runs:
        return {'trend': 'unknown', 'progression_rate': 0}
    
    # Group runs by week
    weekly_loads = {}
    for run in runs:
        week_start = run['date'] - timedelta(days=run['date'].weekday())
        week_key = week_start.strftime('%Y-%W')
        
        if week_key not in weekly_loads:
            weekly_loads[week_key] = {'distance': 0, 'runs': 0}
        
        weekly_loads[week_key]['distance'] += run['distance']
        weekly_loads[week_key]['runs'] += 1
    
    # Calculate progression
    weeks = sorted(weekly_loads.keys())
    if len(weeks) < 2:
        return {'trend': 'insufficient_data', 'progression_rate': 0}
    
    # Simple linear progression analysis
    distances = [weekly_loads[week]['distance'] for week in weeks]
    
    # Calculate trend
    if distances[-1] > distances[0]:
        trend = 'increasing'
    elif distances[-1] < distances[0]:
        trend = 'decreasing'
    else:
        trend = 'stable'
    
    # Calculate average progression rate
    progression_rate = (distances[-1] - distances[0]) / len(weeks)
    
    return {
        'trend': trend,
        'progression_rate': round(progression_rate, 1),
        'weekly_distances': distances,
        'weeks': len(weeks)
    }


def _analyze_weekly_load_trends(runs: List[Dict]) -> Dict:
    """Analyze weekly training load trends."""
    if not runs:
        return {'pattern': 'unknown', 'consistency': 0}
    
    # Group by week and calculate loads
    weekly_data = {}
    for run in runs:
        week_start = run['date'] - timedelta(days=run['date'].weekday())
        week_key = week_start.strftime('%Y-%W')
        
        if week_key not in weekly_data:
            weekly_data[week_key] = {'distance': 0, 'runs': 0, 'days': set()}
        
        weekly_data[week_key]['distance'] += run['distance']
        weekly_data[week_key]['runs'] += 1
        weekly_data[week_key]['days'].add(run['date'].strftime('%Y-%m-%d'))
    
    # Calculate consistency
    weeks = list(weekly_data.keys())
    if len(weeks) < 2:
        return {'pattern': 'insufficient_data', 'consistency': 0}
    
    distances = [weekly_data[week]['distance'] for week in weeks]
    avg_distance = sum(distances) / len(distances)
    variance = sum((d - avg_distance) ** 2 for d in distances) / len(distances)
    consistency = max(0, 100 - (variance / avg_distance * 100)) if avg_distance > 0 else 0
    
    return {
        'pattern': 'consistent' if consistency > 70 else 'variable',
        'consistency': round(consistency, 1),
        'avg_weekly_distance': round(avg_distance, 1),
        'weeks_analyzed': len(weeks)
    }


def _generate_load_recommendations(load_analysis: Dict, weekly_trends: Dict) -> List[str]:
    """Generate training load recommendations."""
    recommendations = []
    
    trend = load_analysis.get('trend', 'unknown')
    progression_rate = load_analysis.get('progression_rate', 0)
    consistency = weekly_trends.get('consistency', 0)
    
    # Progression recommendations
    if trend == 'increasing' and progression_rate > 3:
        recommendations.append("Consider slowing your mileage progression to reduce injury risk")
    elif trend == 'decreasing':
        recommendations.append("Gradual mileage increases could help improve fitness")
    elif trend == 'stable':
        recommendations.append("Consider adding small weekly increases for continued adaptation")
    
    # Consistency recommendations
    if consistency < 50:
        recommendations.append("Focus on more consistent weekly training for better adaptation")
    elif consistency > 80:
        recommendations.append("Great consistency! Consider planned variation for continued progress")
    
    # Default advice
    if not recommendations:
        recommendations.append("Continue current training approach with gradual progression")
    
    return recommendations


def _analyze_fitness_trends(runs: List[Dict]) -> Dict:
    """Analyze fitness trends from running data."""
    if not runs:
        return {'trend': 'unknown', 'metrics': {}}
    
    # Simple pace improvement analysis
    recent_runs = runs[:10]  # Last 10 runs
    older_runs = runs[10:20] if len(runs) > 10 else []
    
    if not recent_runs or not older_runs:
        return {'trend': 'insufficient_data', 'metrics': {}}
    
    # Calculate average pace (simplified)
    recent_avg_distance = sum(run['distance'] for run in recent_runs) / len(recent_runs)
    older_avg_distance = sum(run['distance'] for run in older_runs) / len(older_runs)
    
    # Simple fitness indicator
    fitness_trend = 'improving' if recent_avg_distance > older_avg_distance else 'stable'
    
    return {
        'trend': fitness_trend,
        'metrics': {
            'recent_avg_distance': round(recent_avg_distance, 1),
            'older_avg_distance': round(older_avg_distance, 1),
            'runs_analyzed': len(recent_runs) + len(older_runs)
        }
    }


def _analyze_training_consistency(runs: List[Dict]) -> Dict:
    """Analyze training consistency patterns."""
    if not runs:
        return {'consistency_score': 0, 'pattern': 'unknown'}
    
    # Calculate days between runs
    gaps = []
    for i in range(1, len(runs)):
        gap = (runs[i-1]['date'] - runs[i]['date']).days
        gaps.append(gap)
    
    if not gaps:
        return {'consistency_score': 0, 'pattern': 'single_run'}
    
    # Calculate consistency score
    avg_gap = sum(gaps) / len(gaps)
    gap_variance = sum((gap - avg_gap) ** 2 for gap in gaps) / len(gaps)
    
    # Lower variance = higher consistency
    consistency_score = max(0, 100 - gap_variance * 5)
    
    pattern = 'consistent' if consistency_score > 70 else 'irregular'
    
    return {
        'consistency_score': round(consistency_score, 1),
        'pattern': pattern,
        'avg_gap_days': round(avg_gap, 1),
        'max_gap_days': max(gaps),
        'min_gap_days': min(gaps)
    }


def _generate_health_recommendations(user_data: Dict, runs: List[Dict]) -> List[str]:
    """Generate personalized health recommendations."""
    recommendations = []
    
    # Age-based recommendations
    age = user_data.get('age')
    if age and age > 50:
        recommendations.append("Include extra recovery time and joint-friendly cross-training")
    elif age and age < 25:
        recommendations.append("Focus on building a strong aerobic base and proper form")
    
    # Training level recommendations
    training_level = user_data.get('trainingLevel', 'beginner')
    if training_level == 'beginner':
        recommendations.append("Prioritize consistency over intensity in your training")
    elif training_level == 'advanced':
        recommendations.append("Monitor training load carefully to avoid overreaching")
    
    # Injury history recommendations
    injury_history = user_data.get('injuryHistory', '')
    if injury_history:
        recommendations.append("Pay special attention to injury prevention and warning signs")
    
    # Training frequency recommendations
    if len(runs) > 20:  # Active runner
        recommendations.append("Consider periodic recovery weeks to maintain long-term health")
    
    return recommendations or ["Continue current approach with focus on gradual progression"]


# =============================================================================
# FORMATTING FUNCTIONS
# =============================================================================

def _format_injury_risk_analysis(risk_analysis: Dict, injury_history_risk: Dict, 
                                pattern_risks: Dict, time_period: str, num_runs: int) -> str:
    """Format comprehensive injury risk analysis."""
    
    # Determine overall risk level
    risk_levels = [risk_analysis['risk_level'], injury_history_risk['risk_level'], pattern_risks['risk_level']]
    if 'high' in risk_levels:
        overall_risk = 'high'
        risk_emoji = '🚨'
    elif 'moderate' in risk_levels:
        overall_risk = 'moderate'
        risk_emoji = '⚠️'
    else:
        overall_risk = 'low'
        risk_emoji = '✅'
    
    result = f"🏥 Injury Risk Analysis ({time_period})\n\n"
    result += f"{risk_emoji} **Overall Risk Level: {overall_risk.upper()}**\n"
    result += f"📊 Analysis based on {num_runs} runs\n\n"
    
    # Risk factors
    all_factors = (risk_analysis.get('factors', []) + 
                  injury_history_risk.get('factors', []) + 
                  pattern_risks.get('factors', []))
    
    if all_factors:
        result += "⚠️ **Risk Factors Identified:**\n"
        for factor in all_factors:
            result += f"• {factor}\n"
        result += "\n"
    
    # Specific recommendations based on risk level
    result += "💡 **Recommendations:**\n"
    if overall_risk == 'high':
        result += "• Consider reducing training intensity for 1-2 weeks\n"
        result += "• Focus on recovery and sleep optimization\n"
        result += "• Monitor for pain or discomfort during runs\n"
        result += "• Consider consulting a sports medicine professional\n"
    elif overall_risk == 'moderate':
        result += "• Include more recovery days in your schedule\n"
        result += "• Focus on proper warm-up and cool-down routines\n"
        result += "• Monitor training progression carefully\n"
        result += "• Consider cross-training activities\n"
    else:
        result += "• Continue current training approach\n"
        result += "• Maintain consistent progression patterns\n"
        result += "• Keep monitoring for any changes\n"
    
    result += "\n🎯 Remember: Injury prevention is key to long-term running success!"
    
    return result


def _format_recovery_recommendations(recovery_needs: Dict, training_stress: Dict, focus_area: str) -> str:
    """Format recovery recommendations."""
    priority = recovery_needs['priority']
    duration = recovery_needs['duration']
    
    priority_emoji = {'high': '🚨', 'medium': '⚠️', 'low': '✅'}[priority]
    
    result = f"🔄 Recovery Recommendations ({focus_area.title()})\n\n"
    result += f"{priority_emoji} **Priority Level: {priority.upper()}**\n"
    result += f"⏱️ **Recommended Duration: {duration}**\n\n"
    
    # Focus areas
    if recovery_needs['focus_areas']:
        result += "🎯 **Focus Areas:**\n"
        for area in recovery_needs['focus_areas']:
            result += f"• {area}\n"
        result += "\n"
    
    # Recommended activities
    if recovery_needs['activities']:
        result += "🛠️ **Recommended Activities:**\n"
        for activity in recovery_needs['activities']:
            result += f"• {activity}\n"
        result += "\n"
    
    # Training stress context
    stress_metrics = training_stress.get('metrics', {})
    if stress_metrics:
        result += "📊 **Recent Training Load:**\n"
        result += f"• Weekly distance: {stress_metrics.get('weekly_distance', 0)} miles\n"
        result += f"• Training frequency: {stress_metrics.get('frequency', 0)} runs/week\n"
        result += f"• Stress level: {training_stress.get('stress_level', 'unknown')}\n\n"
    
    result += "💡 **Remember:** Recovery is when adaptation happens - it's not time off, it's training!"
    
    return result


def _format_training_load_analysis(load_analysis: Dict, weekly_trends: Dict, 
                                  recommendations: List[str], period: str) -> str:
    """Format training load analysis."""
    trend = load_analysis.get('trend', 'unknown')
    progression_rate = load_analysis.get('progression_rate', 0)
    consistency = weekly_trends.get('consistency', 0)
    avg_weekly = weekly_trends.get('avg_weekly_distance', 0)
    
    trend_emoji = {'increasing': '📈', 'decreasing': '📉', 'stable': '➡️'}.get(trend, '❓')
    
    result = f"📊 Training Load Analysis ({period})\n\n"
    result += f"{trend_emoji} **Load Trend: {trend.title()}**\n"
    result += f"📏 **Average Weekly Distance: {avg_weekly} miles**\n"
    result += f"📊 **Consistency Score: {consistency}%**\n\n"
    
    if progression_rate != 0:
        result += f"📈 **Progression Rate: {progression_rate:+.1f} miles/week**\n\n"
    
    # Consistency interpretation
    if consistency > 80:
        result += "✅ **Excellent consistency!** Your training is very regular.\n"
    elif consistency > 60:
        result += "✅ **Good consistency.** Minor variations in weekly training.\n"
    else:
        result += "⚠️ **Variable training pattern.** Consider more consistent scheduling.\n"
    
    result += "\n💡 **Recommendations:**\n"
    for rec in recommendations:
        result += f"• {rec}\n"
    
    result += "\n🎯 **Key Insight:** Consistent, gradual progression minimizes injury risk while maximizing fitness gains."
    
    return result


def _format_health_insights(fitness_trends: Dict, consistency_insights: Dict, 
                          health_recommendations: List[str], user_data: Dict) -> str:
    """Format comprehensive health insights."""
    fitness_trend = fitness_trends.get('trend', 'unknown')
    consistency_score = consistency_insights.get('consistency_score', 0)
    pattern = consistency_insights.get('pattern', 'unknown')
    
    trend_emoji = {'improving': '📈', 'declining': '📉', 'stable': '➡️'}.get(fitness_trend, '❓')
    
    result = "🏥 Health Insights\n\n"
    result += f"{trend_emoji} **Fitness Trend: {fitness_trend.title()}**\n"
    result += f"📊 **Training Consistency: {consistency_score}% ({pattern})**\n\n"
    
    # User context
    age = user_data.get('age')
    training_level = user_data.get('trainingLevel', 'unknown')
    
    result += "👤 **Your Profile:**\n"
    if age:
        result += f"• Age: {age} years\n"
    result += f"• Training Level: {training_level.title()}\n"
    
    injury_history = user_data.get('injuryHistory', '')
    if injury_history:
        result += "• Previous injuries noted\n"
    else:
        result += "• No injury history recorded\n"
    
    result += "\n💡 **Personalized Recommendations:**\n"
    for rec in health_recommendations:
        result += f"• {rec}\n"
    
    # Health score calculation
    health_score = min(100, (consistency_score + (70 if fitness_trend == 'improving' else 50)) / 2)
    result += f"\n🎯 **Overall Health Score: {health_score:.0f}/100**\n"
    
    if health_score > 80:
        result += "Excellent health trajectory! Keep up the great work."
    elif health_score > 60:
        result += "Good health patterns with room for optimization."
    else:
        result += "Focus on consistency and gradual improvement."
    
    return result