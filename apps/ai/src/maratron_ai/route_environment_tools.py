"""Route & Environment MCP Tools for Smart Running Decisions

This module provides sophisticated tools for route planning, weather analysis,
environment optimization, and terrain-based training recommendations.
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
# ROUTE & ENVIRONMENT ANALYSIS TOOLS
# =============================================================================

@handle_database_errors
@require_user_context
async def analyze_environment_impact_tool(time_period: str = "4weeks") -> str:
    """Analyze how different training environments affect performance.
    
    Args:
        time_period: Period to analyze ('2weeks', '4weeks', '8weeks', '12weeks')
    """
    try:
        user_id = get_current_user_id()
        pool = await get_pool()
        
        # Calculate time period
        period_map = {
            '2weeks': 14, '4weeks': 28, '8weeks': 56, '12weeks': 84
        }
        days = period_map.get(time_period, 28)
        start_date = datetime.now() - timedelta(days=days)
        
        # Get runs with environment data
        runs = await fetch_with_timeout(
            pool,
            'SELECT * FROM "Runs" WHERE "userId"=$1 AND date >= $2 AND "trainingEnvironment" IS NOT NULL ORDER BY date DESC',
            user_id, start_date
        )
        
        if len(runs) < 5:
            return f"🌍 Environment Impact Analysis ({time_period})\n\n" + \
                   "Need at least 5 runs with environment data for meaningful analysis.\n" + \
                   "Make sure to record whether your runs are outdoor, treadmill, or indoor!"
        
        # Analyze environment performance
        environment_analysis = _analyze_environment_performance(runs)
        recommendations = _generate_environment_recommendations(environment_analysis)
        
        return _format_environment_analysis(environment_analysis, recommendations, time_period, len(runs))
        
    except Exception as e:
        return f"Error analyzing environment impact: {str(e)}"


@handle_database_errors
@require_user_context
async def get_route_recommendations_tool(goal_type: str = "general", distance: float = 5.0, 
                                       conditions: str = "any") -> str:
    """Get intelligent route recommendations based on goals and conditions.
    
    Args:
        goal_type: Type of training ('speed', 'endurance', 'recovery', 'hills', 'general')
        distance: Target distance for the route
        conditions: Weather/environmental conditions ('hot', 'cold', 'rainy', 'windy', 'any')
    """
    try:
        user_id = get_current_user_id()
        pool = await get_pool()
        
        # Get user preferences and recent runs
        user_data = await fetchrow_with_timeout(
            pool,
            'SELECT * FROM "Users" WHERE id=$1',
            user_id
        )
        
        recent_runs = await fetch_with_timeout(
            pool,
            'SELECT * FROM "Runs" WHERE "userId"=$1 ORDER BY date DESC LIMIT 20',
            user_id
        )
        
        if not user_data:
            return "❌ User profile not found."
        
        # Generate route recommendations
        recommendations = _generate_route_recommendations(
            goal_type, distance, conditions, user_data, recent_runs
        )
        
        return _format_route_recommendations(recommendations, goal_type, distance, conditions)
        
    except Exception as e:
        return f"Error generating route recommendations: {str(e)}"


@handle_database_errors
@require_user_context
async def analyze_elevation_impact_tool() -> str:
    """Analyze how elevation affects performance and provide training recommendations."""
    try:
        user_id = get_current_user_id()
        pool = await get_pool()
        
        # Get runs with elevation data
        runs = await fetch_with_timeout(
            pool,
            'SELECT * FROM "Runs" WHERE "userId"=$1 AND "elevationGain" IS NOT NULL ORDER BY date DESC LIMIT 30',
            user_id
        )
        
        if len(runs) < 5:
            return "⛰️ Elevation Impact Analysis\n\n" + \
                   "Need at least 5 runs with elevation data for analysis.\n" + \
                   "Record elevation gain to get insights on hill training impact!"
        
        # Analyze elevation impact
        elevation_analysis = _analyze_elevation_performance(runs)
        hill_training_advice = _generate_hill_training_recommendations(elevation_analysis)
        
        return _format_elevation_analysis(elevation_analysis, hill_training_advice, len(runs))
        
    except Exception as e:
        return f"Error analyzing elevation impact: {str(e)}"


@handle_database_errors
@require_user_context
async def get_seasonal_training_advice_tool(season: str = "current") -> str:
    """Get seasonal training advice based on current conditions and time of year.
    
    Args:
        season: Season to get advice for ('spring', 'summer', 'fall', 'winter', 'current')
    """
    try:
        user_id = get_current_user_id()
        pool = await get_pool()
        
        # Get user profile and location preferences
        user_data = await fetchrow_with_timeout(
            pool,
            'SELECT * FROM "Users" WHERE id=$1',
            user_id
        )
        
        # Get recent runs to understand current patterns
        recent_runs = await fetch_with_timeout(
            pool,
            'SELECT * FROM "Runs" WHERE "userId"=$1 AND date >= NOW() - INTERVAL \'30 days\' ORDER BY date DESC',
            user_id
        )
        
        if not user_data:
            return "❌ User profile not found."
        
        # Determine season if current
        if season == "current":
            current_month = datetime.now().month
            if current_month in [12, 1, 2]:
                season = "winter"
            elif current_month in [3, 4, 5]:
                season = "spring"
            elif current_month in [6, 7, 8]:
                season = "summer"
            else:
                season = "fall"
        
        # Generate seasonal advice
        seasonal_advice = _generate_seasonal_training_advice(season, user_data, recent_runs)
        
        return _format_seasonal_advice(seasonal_advice, season)
        
    except Exception as e:
        return f"Error generating seasonal advice: {str(e)}"


@handle_database_errors
@require_user_context
async def optimize_training_environment_tool() -> str:
    """Analyze training environment patterns and suggest optimizations."""
    try:
        user_id = get_current_user_id()
        pool = await get_pool()
        
        # Get recent runs with environment data
        runs = await fetch_with_timeout(
            pool,
            'SELECT * FROM "Runs" WHERE "userId"=$1 AND date >= NOW() - INTERVAL \'60 days\' ORDER BY date DESC',
            user_id
        )
        
        if not runs:
            return "🌍 Training Environment Optimization\n\n" + \
                   "No recent runs found. Record some runs to get environment optimization advice!"
        
        # Analyze current environment usage
        environment_usage = _analyze_environment_usage(runs)
        optimization_suggestions = _generate_environment_optimizations(environment_usage, runs)
        
        return _format_environment_optimization(environment_usage, optimization_suggestions, len(runs))
        
    except Exception as e:
        return f"Error optimizing training environment: {str(e)}"


# =============================================================================
# ANALYSIS HELPER FUNCTIONS
# =============================================================================

def _analyze_environment_performance(runs: List[Dict]) -> Dict:
    """Analyze performance across different training environments."""
    environments = {}
    
    for run in runs:
        env = run.get('trainingEnvironment', 'unknown')
        if env not in environments:
            environments[env] = {
                'runs': [],
                'total_distance': 0,
                'count': 0
            }
        
        environments[env]['runs'].append(run)
        environments[env]['total_distance'] += run['distance']
        environments[env]['count'] += 1
    
    # Calculate average performance for each environment
    for env in environments:
        env_data = environments[env]
        env_data['avg_distance'] = env_data['total_distance'] / env_data['count']
        
        # Calculate average pace if available
        paces = [run.get('pace') for run in env_data['runs'] if run.get('pace')]
        env_data['has_pace_data'] = len(paces) > 0
        env_data['pace_count'] = len(paces)
    
    return environments


def _generate_environment_recommendations(environment_analysis: Dict) -> List[str]:
    """Generate recommendations based on environment analysis."""
    recommendations = []
    
    # Check environment variety
    env_count = len(environment_analysis)
    if env_count == 1:
        env_name = list(environment_analysis.keys())[0]
        if env_name == 'treadmill':
            recommendations.append("Consider adding outdoor runs for surface variety and mental stimulation")
        elif env_name == 'outdoor':
            recommendations.append("Treadmill running can provide controlled conditions for speed work")
        else:
            recommendations.append("Try mixing different training environments for variety")
    
    # Analyze outdoor vs indoor ratio
    outdoor_runs = environment_analysis.get('outdoor', {}).get('count', 0)
    treadmill_runs = environment_analysis.get('treadmill', {}).get('count', 0)
    total_runs = sum(env.get('count', 0) for env in environment_analysis.values())
    
    if total_runs > 0:
        outdoor_ratio = outdoor_runs / total_runs
        if outdoor_ratio < 0.3:
            recommendations.append("Increase outdoor running for race-specific preparation")
        elif outdoor_ratio > 0.9:
            recommendations.append("Occasional treadmill runs can help with consistent pacing")
    
    # Performance-based recommendations
    if len(environment_analysis) > 1:
        # Find best performing environment
        best_env = max(environment_analysis.keys(), 
                      key=lambda env: environment_analysis[env]['avg_distance'])
        recommendations.append(f"You tend to run longer distances in {best_env} conditions")
    
    return recommendations or ["Continue varying your training environments for optimal adaptation"]


def _generate_route_recommendations(goal_type: str, distance: float, conditions: str, 
                                   user_data: Dict, recent_runs: List[Dict]) -> Dict:
    """Generate intelligent route recommendations."""
    recommendations = {
        'route_type': '',
        'surface': '',
        'terrain': '',
        'environment': '',
        'specific_advice': [],
        'alternatives': []
    }
    
    # Goal-specific recommendations
    if goal_type == 'speed':
        recommendations['route_type'] = 'Flat, fast route'
        recommendations['surface'] = 'Track or smooth pavement'
        recommendations['terrain'] = 'Flat with minimal turns'
        recommendations['environment'] = 'Controlled conditions preferred'
        recommendations['specific_advice'] = [
            'Choose a route with consistent footing',
            'Avoid busy intersections for uninterrupted intervals',
            'Consider a track for precise distance measurement'
        ]
    elif goal_type == 'hills':
        recommendations['route_type'] = 'Rolling hills or sustained climbs'
        recommendations['surface'] = 'Varied terrain'
        recommendations['terrain'] = 'Gradual to moderate inclines'
        recommendations['environment'] = 'Outdoor preferred for real hill training'
        recommendations['specific_advice'] = [
            'Start with gradual hills and progress to steeper grades',
            'Include both uphill and downhill running',
            'Focus on effort rather than pace on hills'
        ]
    elif goal_type == 'endurance':
        recommendations['route_type'] = 'Scenic, comfortable route'
        recommendations['surface'] = 'Soft surfaces when possible'
        recommendations['terrain'] = 'Gently rolling or flat'
        recommendations['environment'] = 'Outdoor for mental engagement'
        recommendations['specific_advice'] = [
            'Choose routes with interesting scenery',
            'Plan hydration stops for longer distances',
            'Consider loops to stay close to home/car'
        ]
    elif goal_type == 'recovery':
        recommendations['route_type'] = 'Easy, familiar route'
        recommendations['surface'] = 'Soft, forgiving surfaces'
        recommendations['terrain'] = 'Flat, minimal elevation'
        recommendations['environment'] = 'Quiet, low-stress environment'
        recommendations['specific_advice'] = [
            'Choose very familiar routes to reduce mental stress',
            'Opt for softer surfaces like trails or tracks',
            'Keep it short and comfortable'
        ]
    else:  # general
        recommendations['route_type'] = 'Varied, interesting route'
        recommendations['surface'] = 'Mixed surfaces'
        recommendations['terrain'] = 'Some variety in elevation'
        recommendations['environment'] = 'Outdoor when weather permits'
        recommendations['specific_advice'] = [
            'Mix different types of routes throughout the week',
            'Explore new areas to keep training interesting',
            'Adapt route choice to daily goals and energy levels'
        ]
    
    # Condition-specific adjustments
    if conditions == 'hot':
        recommendations['specific_advice'].extend([
            'Choose shaded routes when possible',
            'Plan early morning or evening runs',
            'Ensure access to water/hydration'
        ])
    elif conditions == 'cold':
        recommendations['specific_advice'].extend([
            'Choose routes with some protection from wind',
            'Consider shorter loops closer to home',
            'Be extra careful on potentially icy surfaces'
        ])
    elif conditions == 'rainy':
        recommendations['specific_advice'].extend([
            'Opt for covered or indoor alternatives',
            'If running outside, choose well-lit, safe routes',
            'Avoid trails that may be muddy or slippery'
        ])
    elif conditions == 'windy':
        recommendations['specific_advice'].extend([
            'Choose protected routes or plan out-and-back to split wind exposure',
            'Start into the wind, finish with wind at your back',
            'Adjust effort expectations for headwind sections'
        ])
    
    # Distance-specific advice
    if distance > 10:
        recommendations['specific_advice'].append('Plan fuel and hydration strategy for longer distance')
    elif distance < 3:
        recommendations['specific_advice'].append('Perfect opportunity for higher intensity efforts')
    
    return recommendations


def _analyze_elevation_performance(runs: List[Dict]) -> Dict:
    """Analyze how elevation affects running performance."""
    elevation_data = {
        'flat_runs': [],
        'hilly_runs': [],
        'mountainous_runs': []
    }
    
    for run in runs:
        elevation_gain = run.get('elevationGain', 0)
        distance = run['distance']
        
        # Categorize by elevation gain per mile
        if distance > 0:
            elevation_per_mile = elevation_gain / distance
            
            if elevation_per_mile < 20:  # Less than 20 ft/mile
                elevation_data['flat_runs'].append(run)
            elif elevation_per_mile < 50:  # 20-50 ft/mile
                elevation_data['hilly_runs'].append(run)
            else:  # More than 50 ft/mile
                elevation_data['mountainous_runs'].append(run)
    
    # Calculate averages for each category
    analysis = {}
    for category, runs_list in elevation_data.items():
        if runs_list:
            total_distance = sum(run['distance'] for run in runs_list)
            avg_distance = total_distance / len(runs_list)
            total_elevation = sum(run.get('elevationGain', 0) for run in runs_list)
            avg_elevation = total_elevation / len(runs_list)
            
            analysis[category] = {
                'count': len(runs_list),
                'avg_distance': round(avg_distance, 1),
                'avg_elevation': round(avg_elevation, 0),
                'total_distance': round(total_distance, 1)
            }
        else:
            analysis[category] = {
                'count': 0,
                'avg_distance': 0,
                'avg_elevation': 0,
                'total_distance': 0
            }
    
    return analysis


def _generate_hill_training_recommendations(elevation_analysis: Dict) -> List[str]:
    """Generate hill training recommendations based on elevation analysis."""
    recommendations = []
    
    flat_count = elevation_analysis.get('flat_runs', {}).get('count', 0)
    hilly_count = elevation_analysis.get('hilly_runs', {}).get('count', 0)
    mountainous_count = elevation_analysis.get('mountainous_runs', {}).get('count', 0)
    
    total_runs = flat_count + hilly_count + mountainous_count
    
    if total_runs == 0:
        return ["Record more runs with elevation data to get hill training advice"]
    
    # Analyze hill training ratio
    hill_ratio = (hilly_count + mountainous_count) / total_runs
    
    if hill_ratio < 0.2:  # Less than 20% hills
        recommendations.extend([
            "Add more hill training to build strength and power",
            "Start with gentle hills and gradually increase steepness",
            "Hill training improves running economy and race performance"
        ])
    elif hill_ratio > 0.6:  # More than 60% hills
        recommendations.extend([
            "Consider adding some flat speed work for turnover",
            "Balance hill training with flat running for complete development",
            "Ensure adequate recovery between hill sessions"
        ])
    else:
        recommendations.extend([
            "Good balance of hill and flat training",
            "Continue current elevation variety",
            "Consider periodizing hill emphasis based on race goals"
        ])
    
    # Specific recommendations based on patterns
    if mountainous_count > 0:
        recommendations.append("Great job tackling challenging elevation - excellent strength training")
    
    if flat_count > hilly_count + mountainous_count:
        recommendations.append("Consider adding one hill session per week for strength development")
    
    return recommendations


def _generate_seasonal_training_advice(season: str, user_data: Dict, recent_runs: List[Dict]) -> Dict:
    """Generate season-specific training advice."""
    advice = {
        'focus': '',
        'training_emphasis': [],
        'environmental_tips': [],
        'equipment_suggestions': [],
        'race_considerations': []
    }
    
    if season == 'spring':
        advice['focus'] = 'Building base and preparing for racing season'
        advice['training_emphasis'] = [
            'Gradual mileage increases after winter',
            'Add speed work as fitness improves',
            'Focus on consistency and injury prevention'
        ]
        advice['environmental_tips'] = [
            'Dress in layers for variable temperatures',
            'Be cautious of wet and slippery conditions',
            'Take advantage of increasing daylight'
        ]
        advice['equipment_suggestions'] = [
            'Transition to lighter running gear',
            'Consider trail shoes for muddy conditions',
            'Light jacket for cool mornings'
        ]
        advice['race_considerations'] = [
            'Perfect time for 5K and 10K races',
            'Build toward summer half marathon goals',
            'Use races as fitness benchmarks'
        ]
    
    elif season == 'summer':
        advice['focus'] = 'Peak training and racing season'
        advice['training_emphasis'] = [
            'Maintain fitness with heat considerations',
            'Early morning or evening training',
            'Adjust effort for temperature'
        ]
        advice['environmental_tips'] = [
            'Start runs early to avoid peak heat',
            'Increase hydration before, during, and after runs',
            'Seek shaded routes when possible'
        ]
        advice['equipment_suggestions'] = [
            'Light-colored, breathable clothing',
            'Hat and sunglasses for sun protection',
            'Electrolyte replacement for longer runs'
        ]
        advice['race_considerations'] = [
            'Prime time for distance races',
            'Marathon training season',
            'Adjust race pace expectations for heat'
        ]
    
    elif season == 'fall':
        advice['focus'] = 'Peak racing and goal achievement'
        advice['training_emphasis'] = [
            'Sharpen fitness for fall race goals',
            'Maintain summer fitness base',
            'Focus on race-specific preparation'
        ]
        advice['environmental_tips'] = [
            'Ideal running temperatures',
            'Watch for wet leaves and slippery surfaces',
            'Adjust to decreasing daylight'
        ]
        advice['equipment_suggestions'] = [
            'Layer for temperature changes',
            'Reflective gear for darker conditions',
            'Shoes with good traction for leaves'
        ]
        advice['race_considerations'] = [
            'Prime marathon and half marathon season',
            'Perfect conditions for personal bests',
            'Plan taper and peak timing carefully'
        ]
    
    else:  # winter
        advice['focus'] = 'Base building and maintenance'
        advice['training_emphasis'] = [
            'Build aerobic base for next year',
            'Maintain consistency despite weather',
            'Focus on strength and flexibility'
        ]
        advice['environmental_tips'] = [
            'Layer appropriately for cold weather',
            'Be extra cautious on ice and snow',
            'Consider treadmill for severe weather'
        ]
        advice['equipment_suggestions'] = [
            'Warm layers and wind protection',
            'Traction devices for icy conditions',
            'Moisture-wicking base layers'
        ]
        advice['race_considerations'] = [
            'Perfect time for indoor track meets',
            'Holiday-themed fun runs',
            'Focus on preparation for spring races'
        ]
    
    return advice


def _analyze_environment_usage(runs: List[Dict]) -> Dict:
    """Analyze how user distributes training across different environments."""
    usage = {}
    total_runs = len(runs)
    
    for run in runs:
        env = run.get('trainingEnvironment', 'unknown')
        if env not in usage:
            usage[env] = {
                'count': 0,
                'total_distance': 0,
                'percentage': 0
            }
        
        usage[env]['count'] += 1
        usage[env]['total_distance'] += run['distance']
    
    # Calculate percentages
    for env in usage:
        usage[env]['percentage'] = round((usage[env]['count'] / total_runs) * 100, 1)
        usage[env]['avg_distance'] = round(usage[env]['total_distance'] / usage[env]['count'], 1)
    
    return usage


def _generate_environment_optimizations(usage: Dict, runs: List[Dict]) -> List[str]:
    """Generate environment optimization suggestions."""
    suggestions = []
    
    # Check for environment diversity
    env_count = len(usage)
    if env_count == 1:
        env_name = list(usage.keys())[0]
        suggestions.append(f"Consider diversifying beyond {env_name} training for better adaptation")
    
    # Check outdoor/indoor balance
    outdoor_pct = usage.get('outdoor', {}).get('percentage', 0)
    treadmill_pct = usage.get('treadmill', {}).get('percentage', 0)
    
    if outdoor_pct < 30:
        suggestions.append("Increase outdoor running for race-specific conditions and mental benefits")
    elif outdoor_pct > 90:
        suggestions.append("Consider some treadmill runs for controlled pace work and bad weather days")
    
    # Check for weather adaptability
    if len(runs) > 10:  # Only suggest if enough data
        recent_month_runs = [run for run in runs if (datetime.now() - run['date']).days <= 30]
        if len(recent_month_runs) < len(runs) * 0.3:  # Less than 30% of runs in last month
            suggestions.append("Maintain training consistency regardless of weather conditions")
    
    # Performance-based suggestions
    if len(usage) > 1:
        best_env = max(usage.keys(), key=lambda env: usage[env]['avg_distance'])
        suggestions.append(f"You tend to perform best in {best_env} conditions - leverage this for key workouts")
    
    return suggestions or ["Current environment usage looks well-balanced"]


# =============================================================================
# FORMATTING FUNCTIONS
# =============================================================================

def _format_environment_analysis(environment_analysis: Dict, recommendations: List[str], 
                                time_period: str, num_runs: int) -> str:
    """Format environment impact analysis."""
    result = f"🌍 Environment Impact Analysis ({time_period})\n\n"
    result += f"📊 Analysis based on {num_runs} runs\n\n"
    
    # Environment breakdown
    result += "🏃 **Training Environment Breakdown:**\n"
    for env, data in environment_analysis.items():
        count = data['count']
        avg_distance = data['avg_distance']
        percentage = round((count / num_runs) * 100, 1)
        
        result += f"• {env.title()}: {count} runs ({percentage}%) - Avg: {avg_distance:.1f} miles\n"
    
    result += "\n💡 **Insights & Recommendations:**\n"
    for rec in recommendations:
        result += f"• {rec}\n"
    
    result += "\n🎯 **Key Takeaway:** Varying training environments improves adaptation and keeps training engaging!"
    
    return result


def _format_route_recommendations(recommendations: Dict, goal_type: str, 
                                distance: float, conditions: str) -> str:
    """Format route recommendations."""
    result = f"🗺️ Route Recommendations\n\n"
    result += f"🎯 **Goal:** {goal_type.title()} training\n"
    result += f"📏 **Distance:** {distance} miles\n"
    result += f"🌤️ **Conditions:** {conditions.title()}\n\n"
    
    result += f"🛤️ **Recommended Route Type:** {recommendations['route_type']}\n"
    result += f"🏃 **Surface:** {recommendations['surface']}\n"
    result += f"⛰️ **Terrain:** {recommendations['terrain']}\n"
    result += f"🌍 **Environment:** {recommendations['environment']}\n\n"
    
    if recommendations['specific_advice']:
        result += "💡 **Specific Recommendations:**\n"
        for advice in recommendations['specific_advice']:
            result += f"• {advice}\n"
    
    result += "\n🗺️ **Pro Tip:** Save successful routes in your running app for future reference!"
    
    return result


def _format_elevation_analysis(elevation_analysis: Dict, recommendations: List[str], num_runs: int) -> str:
    """Format elevation impact analysis."""
    result = "⛰️ Elevation Impact Analysis\n\n"
    result += f"📊 Analysis based on {num_runs} runs with elevation data\n\n"
    
    # Elevation breakdown
    result += "🏔️ **Elevation Training Breakdown:**\n"
    
    flat_data = elevation_analysis.get('flat_runs', {})
    hilly_data = elevation_analysis.get('hilly_runs', {})
    mountainous_data = elevation_analysis.get('mountainous_runs', {})
    
    if flat_data.get('count', 0) > 0:
        result += f"• Flat runs (<20 ft/mile): {flat_data['count']} runs, {flat_data['total_distance']} miles total\n"
    
    if hilly_data.get('count', 0) > 0:
        result += f"• Hilly runs (20-50 ft/mile): {hilly_data['count']} runs, {hilly_data['total_distance']} miles total\n"
    
    if mountainous_data.get('count', 0) > 0:
        result += f"• Mountainous runs (>50 ft/mile): {mountainous_data['count']} runs, {mountainous_data['total_distance']} miles total\n"
    
    result += "\n💡 **Hill Training Recommendations:**\n"
    for rec in recommendations:
        result += f"• {rec}\n"
    
    result += "\n⛰️ **Remember:** Hills are speed work in disguise - they build power and strength!"
    
    return result


def _format_seasonal_advice(seasonal_advice: Dict, season: str) -> str:
    """Format seasonal training advice."""
    result = f"🌱 Seasonal Training Guide - {season.title()}\n\n"
    result += f"🎯 **Season Focus:** {seasonal_advice['focus']}\n\n"
    
    if seasonal_advice['training_emphasis']:
        result += "🏃 **Training Emphasis:**\n"
        for emphasis in seasonal_advice['training_emphasis']:
            result += f"• {emphasis}\n"
        result += "\n"
    
    if seasonal_advice['environmental_tips']:
        result += "🌤️ **Environmental Tips:**\n"
        for tip in seasonal_advice['environmental_tips']:
            result += f"• {tip}\n"
        result += "\n"
    
    if seasonal_advice['equipment_suggestions']:
        result += "🎽 **Equipment Suggestions:**\n"
        for suggestion in seasonal_advice['equipment_suggestions']:
            result += f"• {suggestion}\n"
        result += "\n"
    
    if seasonal_advice['race_considerations']:
        result += "🏁 **Race Considerations:**\n"
        for consideration in seasonal_advice['race_considerations']:
            result += f"• {consideration}\n"
    
    result += f"\n🌟 **Seasonal Wisdom:** Embrace the unique opportunities each season offers for your running!"
    
    return result


def _format_environment_optimization(usage: Dict, suggestions: List[str], num_runs: int) -> str:
    """Format environment optimization analysis."""
    result = "🌍 Training Environment Optimization\n\n"
    result += f"📊 Analysis of {num_runs} recent runs\n\n"
    
    # Current usage breakdown
    result += "📈 **Current Environment Usage:**\n"
    for env, data in usage.items():
        count = data['count']
        percentage = data['percentage']
        avg_distance = data['avg_distance']
        
        result += f"• {env.title()}: {percentage}% ({count} runs) - Avg: {avg_distance} miles\n"
    
    result += "\n🔧 **Optimization Suggestions:**\n"
    for suggestion in suggestions:
        result += f"• {suggestion}\n"
    
    result += "\n🎯 **Goal:** Optimize environment mix for better adaptation and performance!"
    
    return result