"""Competition & Racing MCP Tools for Race Preparation and Performance Analysis

This module provides sophisticated tools for race strategy planning, competition analysis,
performance benchmarking, and post-race insights.
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
# COMPETITION & RACING TOOLS
# =============================================================================

@handle_database_errors
@require_user_context
async def create_race_strategy_tool(race_distance: float, goal_time: str, 
                                   race_date: str, course_type: str = "road") -> str:
    """Create a comprehensive race strategy based on fitness and race details.
    
    Args:
        race_distance: Distance of the race in miles
        goal_time: Target finish time (HH:MM:SS format)
        race_date: Race date (YYYY-MM-DD format)
        course_type: Type of course ('road', 'trail', 'track', 'hilly', 'flat')
    """
    try:
        user_id = get_current_user_id()
        pool = await get_pool()
        
        # Get user profile and fitness data
        user_data = await fetchrow_with_timeout(
            pool,
            'SELECT * FROM "Users" WHERE id=$1',
            user_id
        )
        
        # Get recent runs for fitness assessment
        recent_runs = await fetch_with_timeout(
            pool,
            'SELECT * FROM "Runs" WHERE "userId"=$1 AND date >= NOW() - INTERVAL \'60 days\' ORDER BY date DESC',
            user_id
        )
        
        if not user_data:
            return "❌ User profile not found."
        
        if len(recent_runs) < 5:
            return f"🏁 Race Strategy Planning\n\n" + \
                   "Need at least 5 recent runs to create a reliable race strategy.\n" + \
                   "Record more training runs to get personalized race advice!"
        
        # Create race strategy
        strategy = _create_comprehensive_race_strategy(
            race_distance, goal_time, race_date, course_type, user_data, recent_runs
        )
        
        return _format_race_strategy(strategy, race_distance, goal_time, race_date, course_type)
        
    except Exception as e:
        return f"Error creating race strategy: {str(e)}"


@handle_database_errors
@require_user_context
async def analyze_race_readiness_tool(race_distance: float, race_date: str) -> str:
    """Analyze readiness for an upcoming race based on training history.
    
    Args:
        race_distance: Distance of the upcoming race
        race_date: Date of the race (YYYY-MM-DD format)
    """
    try:
        user_id = get_current_user_id()
        pool = await get_pool()
        
        # Parse race date
        try:
            race_datetime = datetime.strptime(race_date, '%Y-%m-%d')
        except ValueError:
            return "❌ Invalid date format. Please use YYYY-MM-DD format."
        
        # Get user profile and training data
        user_data = await fetchrow_with_timeout(
            pool,
            'SELECT * FROM "Users" WHERE id=$1',
            user_id
        )
        
        # Get training history for readiness analysis
        training_runs = await fetch_with_timeout(
            pool,
            'SELECT * FROM "Runs" WHERE "userId"=$1 AND date >= NOW() - INTERVAL \'16 weeks\' ORDER BY date DESC',
            user_id
        )
        
        if not user_data:
            return "❌ User profile not found."
        
        if not training_runs:
            return f"🏁 Race Readiness Analysis\n\n" + \
                   "No training data found. Record your training runs to assess race readiness!"
        
        # Analyze race readiness
        readiness_analysis = _analyze_training_readiness(race_distance, race_datetime, training_runs, user_data)
        
        return _format_race_readiness_analysis(readiness_analysis, race_distance, race_date)
        
    except Exception as e:
        return f"Error analyzing race readiness: {str(e)}"


@handle_database_errors
@require_user_context
async def benchmark_performance_tool(time_period: str = "1year") -> str:
    """Benchmark performance against previous runs and estimated potential.
    
    Args:
        time_period: Period for comparison ('3months', '6months', '1year', 'all')
    """
    try:
        user_id = get_current_user_id()
        pool = await get_pool()
        
        # Calculate time period
        period_map = {
            '3months': 90, '6months': 180, '1year': 365, 'all': 3650
        }
        days = period_map.get(time_period, 365)
        start_date = datetime.now() - timedelta(days=days)
        
        # Get user profile
        user_data = await fetchrow_with_timeout(
            pool,
            'SELECT * FROM "Users" WHERE id=$1',
            user_id
        )
        
        # Get runs for benchmarking
        runs = await fetch_with_timeout(
            pool,
            'SELECT * FROM "Runs" WHERE "userId"=$1 AND date >= $2 ORDER BY date DESC',
            user_id, start_date
        )
        
        if not user_data:
            return "❌ User profile not found."
        
        if len(runs) < 10:
            return f"📊 Performance Benchmarking ({time_period})\n\n" + \
                   "Need at least 10 runs for meaningful performance benchmarking.\n" + \
                   "Keep recording runs to track your progress!"
        
        # Perform benchmarking analysis
        benchmark_analysis = _perform_benchmark_analysis(runs, user_data, time_period)
        
        return _format_benchmark_analysis(benchmark_analysis, time_period, len(runs))
        
    except Exception as e:
        return f"Error benchmarking performance: {str(e)}"


@handle_database_errors
@require_user_context
async def plan_race_calendar_tool(season: str = "current", focus: str = "general") -> str:
    """Plan an optimal race calendar based on goals and training cycles.
    
    Args:
        season: Target season ('spring', 'summer', 'fall', 'winter', 'current', 'year')
        focus: Training focus ('5k', '10k', 'half', 'marathon', 'trail', 'general')
    """
    try:
        user_id = get_current_user_id()
        pool = await get_pool()
        
        # Get user profile and goals
        user_data = await fetchrow_with_timeout(
            pool,
            'SELECT * FROM "Users" WHERE id=$1',
            user_id
        )
        
        # Get recent training to assess current fitness
        recent_runs = await fetch_with_timeout(
            pool,
            'SELECT * FROM "Runs" WHERE "userId"=$1 AND date >= NOW() - INTERVAL \'60 days\' ORDER BY date DESC',
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
        
        # Create race calendar
        calendar_plan = _create_race_calendar_plan(season, focus, user_data, recent_runs)
        
        return _format_race_calendar(calendar_plan, season, focus)
        
    except Exception as e:
        return f"Error planning race calendar: {str(e)}"


@handle_database_errors
@require_user_context
async def analyze_post_race_performance_tool(race_distance: float, race_time: str, 
                                           race_date: str, effort_level: str = "maximum") -> str:
    """Analyze post-race performance and provide insights for future improvement.
    
    Args:
        race_distance: Distance of the completed race
        race_time: Actual finish time (HH:MM:SS format)
        race_date: Date of the race (YYYY-MM-DD format)
        effort_level: Perceived effort ('maximum', 'hard', 'moderate', 'easy')
    """
    try:
        user_id = get_current_user_id()
        pool = await get_pool()
        
        # Parse race date and time
        try:
            race_datetime = datetime.strptime(race_date, '%Y-%m-%d')
            # Convert time to seconds for analysis
            time_parts = race_time.split(':')
            if len(time_parts) == 3:
                race_seconds = int(time_parts[0]) * 3600 + int(time_parts[1]) * 60 + int(time_parts[2])
            else:
                return "❌ Invalid time format. Please use HH:MM:SS format."
        except ValueError:
            return "❌ Invalid date format. Please use YYYY-MM-DD format."
        
        # Get user profile and training context
        user_data = await fetchrow_with_timeout(
            pool,
            'SELECT * FROM "Users" WHERE id=$1',
            user_id
        )
        
        # Get training runs before the race
        pre_race_runs = await fetch_with_timeout(
            pool,
            'SELECT * FROM "Runs" WHERE "userId"=$1 AND date BETWEEN $2 AND $3 ORDER BY date DESC',
            user_id, race_datetime - timedelta(days=90), race_datetime
        )
        
        if not user_data:
            return "❌ User profile not found."
        
        # Analyze performance
        performance_analysis = _analyze_race_performance(
            race_distance, race_seconds, race_datetime, effort_level, user_data, pre_race_runs
        )
        
        return _format_post_race_analysis(performance_analysis, race_distance, race_time, race_date)
        
    except Exception as e:
        return f"Error analyzing post-race performance: {str(e)}"


# =============================================================================
# ANALYSIS HELPER FUNCTIONS
# =============================================================================

def _create_comprehensive_race_strategy(race_distance: float, goal_time: str, race_date: str,
                                       course_type: str, user_data: Dict, recent_runs: List[Dict]) -> Dict:
    """Create a comprehensive race strategy."""
    strategy = {
        'pacing_plan': {},
        'fuel_strategy': {},
        'gear_recommendations': {},
        'taper_plan': {},
        'race_day_tips': [],
        'contingency_plans': []
    }
    
    # Parse goal time
    try:
        time_parts = goal_time.split(':')
        if len(time_parts) == 3:
            goal_seconds = int(time_parts[0]) * 3600 + int(time_parts[1]) * 60 + int(time_parts[2])
        else:
            goal_seconds = int(time_parts[0]) * 60 + int(time_parts[1])  # MM:SS format
    except:
        goal_seconds = 0
    
    # Calculate target pace
    if goal_seconds > 0:
        pace_per_mile_seconds = goal_seconds / race_distance
        pace_minutes = int(pace_per_mile_seconds // 60)
        pace_seconds = int(pace_per_mile_seconds % 60)
        target_pace = f"{pace_minutes}:{pace_seconds:02d}"
    else:
        target_pace = "Unknown"
    
    # Pacing strategy
    strategy['pacing_plan'] = {
        'target_pace': target_pace,
        'start_strategy': 'conservative' if race_distance > 10 else 'controlled',
        'mile_splits': _calculate_optimal_splits(race_distance, goal_seconds, course_type),
        'effort_zones': _define_effort_zones(race_distance)
    }
    
    # Fueling strategy
    if race_distance > 6:
        strategy['fuel_strategy'] = {
            'pre_race': 'Carb load 2-3 days before, light breakfast 2-3 hours before',
            'during_race': f'Start fueling at mile {max(4, race_distance * 0.3):.0f}',
            'hydration': 'Hydrate to thirst, practice in training',
            'products': 'Use only tested products from training'
        }
    
    # Gear recommendations
    strategy['gear_recommendations'] = {
        'shoes': 'Proven racing shoes or lightweight trainers',
        'clothing': 'Minimal, chafe-resistant, weather-appropriate',
        'accessories': 'GPS watch, tested fuel system'
    }
    
    # Taper plan
    race_datetime = datetime.strptime(race_date, '%Y-%m-%d')
    days_until_race = (race_datetime - datetime.now()).days
    
    if race_distance > 13:  # Half marathon or longer
        strategy['taper_plan'] = {
            'duration': '2-3 weeks',
            'volume_reduction': '50-70% of peak volume',
            'intensity': 'Maintain some speed, reduce overall stress',
            'final_week': 'Minimal running, focus on rest and preparation'
        }
    else:
        strategy['taper_plan'] = {
            'duration': '1 week',
            'volume_reduction': '30-50% of normal volume',
            'intensity': 'One tempo/speed session early in week',
            'final_days': 'Easy runs only'
        }
    
    # Race day tips
    strategy['race_day_tips'] = [
        'Arrive early for warm-up and logistics',
        'Stick to proven nutrition and hydration',
        'Start conservatively, negative split if possible',
        'Break race into segments mentally',
        'Have backup plans for different scenarios'
    ]
    
    # Course-specific adjustments
    if course_type == 'hilly':
        strategy['pacing_plan']['hill_strategy'] = 'Run by effort, not pace on hills'
        strategy['race_day_tips'].append('Power hike steep uphills if needed')
    elif course_type == 'trail':
        strategy['race_day_tips'].extend([
            'Focus on effort rather than pace',
            'Be extra cautious on technical sections'
        ])
    
    return strategy


def _analyze_training_readiness(race_distance: float, race_date: datetime, 
                               training_runs: List[Dict], user_data: Dict) -> Dict:
    """Analyze training readiness for upcoming race."""
    readiness = {
        'overall_score': 0,
        'mileage_readiness': {},
        'pace_readiness': {},
        'consistency_score': 0,
        'recommendations': [],
        'risk_factors': []
    }
    
    days_until_race = (race_date - datetime.now()).days
    
    # Analyze recent mileage
    total_distance = sum(run['distance'] for run in training_runs)
    weeks_of_data = len(training_runs) / 7 if training_runs else 0
    avg_weekly_mileage = total_distance / max(weeks_of_data, 1)
    
    # Mileage readiness benchmarks
    if race_distance <= 6.2:  # 10K or shorter
        target_weekly = race_distance * 3
    elif race_distance <= 13.1:  # Half marathon
        target_weekly = race_distance * 2.5
    else:  # Marathon
        target_weekly = race_distance * 1.5
    
    mileage_ratio = avg_weekly_mileage / target_weekly
    
    readiness['mileage_readiness'] = {
        'current_weekly': round(avg_weekly_mileage, 1),
        'target_weekly': round(target_weekly, 1),
        'ratio': round(mileage_ratio, 2),
        'status': 'good' if mileage_ratio > 0.8 else 'low' if mileage_ratio > 0.5 else 'insufficient'
    }
    
    # Long run analysis
    long_runs = [run for run in training_runs if run['distance'] > race_distance * 0.6]
    readiness['long_run_count'] = len(long_runs)
    
    # Consistency analysis
    if len(training_runs) > 4:
        # Calculate weekly consistency
        weekly_runs = {}
        for run in training_runs:
            week = run['date'].strftime('%Y-%W')
            weekly_runs[week] = weekly_runs.get(week, 0) + 1
        
        if weekly_runs:
            avg_runs_per_week = sum(weekly_runs.values()) / len(weekly_runs)
            consistency = min(100, avg_runs_per_week * 25)  # Scale to 0-100
            readiness['consistency_score'] = round(consistency, 1)
    
    # Calculate overall readiness score
    mileage_score = min(100, mileage_ratio * 100)
    long_run_score = min(100, len(long_runs) * 25)
    consistency_score = readiness['consistency_score']
    
    readiness['overall_score'] = round((mileage_score + long_run_score + consistency_score) / 3, 1)
    
    # Generate recommendations
    if mileage_ratio < 0.5:
        readiness['recommendations'].append("Increase weekly mileage gradually")
        readiness['risk_factors'].append("Low training volume for race distance")
    
    if len(long_runs) < 2 and race_distance > 10:
        readiness['recommendations'].append("Include more long runs in preparation")
        readiness['risk_factors'].append("Insufficient long run practice")
    
    if days_until_race < 14:
        readiness['recommendations'].append("Focus on taper and race preparation now")
    elif days_until_race < 30:
        readiness['recommendations'].append("Peak training phase - maintain volume with race pace work")
    
    if consistency_score < 50:
        readiness['recommendations'].append("Improve training consistency")
        readiness['risk_factors'].append("Inconsistent training pattern")
    
    return readiness


def _perform_benchmark_analysis(runs: List[Dict], user_data: Dict, time_period: str) -> Dict:
    """Perform comprehensive performance benchmarking."""
    analysis = {
        'distance_trends': {},
        'pace_trends': {},
        'volume_trends': {},
        'performance_metrics': {},
        'improvement_areas': [],
        'strengths': []
    }
    
    if not runs:
        return analysis
    
    # Analyze distance trends
    distances = [run['distance'] for run in runs]
    analysis['distance_trends'] = {
        'max_distance': max(distances),
        'avg_distance': round(sum(distances) / len(distances), 1),
        'total_distance': round(sum(distances), 1),
        'long_run_percentage': round(len([d for d in distances if d > 8]) / len(distances) * 100, 1)
    }
    
    # Analyze volume trends over time
    monthly_volume = {}
    for run in runs:
        month_key = run['date'].strftime('%Y-%m')
        monthly_volume[month_key] = monthly_volume.get(month_key, 0) + run['distance']
    
    if len(monthly_volume) > 1:
        volumes = list(monthly_volume.values())
        volume_trend = "increasing" if volumes[-1] > volumes[0] else "decreasing"
        analysis['volume_trends'] = {
            'trend': volume_trend,
            'monthly_avg': round(sum(volumes) / len(volumes), 1),
            'latest_month': round(volumes[-1], 1),
            'peak_month': round(max(volumes), 1)
        }
    
    # Performance metrics based on user profile
    vdot = user_data.get('VDOT', 35)
    training_level = user_data.get('trainingLevel', 'beginner')
    
    # Calculate estimated race times based on current fitness
    race_predictions = {
        '5K': _estimate_race_time(vdot, 5.0),
        '10K': _estimate_race_time(vdot, 10.0),
        'Half Marathon': _estimate_race_time(vdot, 13.1),
        'Marathon': _estimate_race_time(vdot, 26.2)
    }
    
    analysis['performance_metrics'] = {
        'current_vdot': vdot,
        'training_level': training_level,
        'race_predictions': race_predictions,
        'weekly_mileage': round(analysis['distance_trends']['total_distance'] / (len(runs) / 7), 1)
    }
    
    # Identify strengths and improvement areas
    avg_distance = analysis['distance_trends']['avg_distance']
    if avg_distance > 7:
        analysis['strengths'].append("Strong endurance base with good average run distance")
    elif avg_distance < 4:
        analysis['improvement_areas'].append("Consider longer runs to build endurance")
    
    if analysis['distance_trends']['long_run_percentage'] > 20:
        analysis['strengths'].append("Good long run frequency for endurance development")
    elif analysis['distance_trends']['long_run_percentage'] < 10:
        analysis['improvement_areas'].append("Add more long runs for better endurance")
    
    # Training consistency
    run_frequency = len(runs) / (30 if time_period == '1month' else 90 if time_period == '3months' else 365)
    if run_frequency > 0.5:  # More than every other day
        analysis['strengths'].append("Excellent training consistency")
    elif run_frequency < 0.3:  # Less than 3 times per week
        analysis['improvement_areas'].append("Improve training consistency")
    
    return analysis


def _create_race_calendar_plan(season: str, focus: str, user_data: Dict, recent_runs: List[Dict]) -> Dict:
    """Create an optimal race calendar plan."""
    calendar = {
        'season_focus': season,
        'distance_focus': focus,
        'recommended_races': [],
        'training_phases': [],
        'key_principles': []
    }
    
    # Season-specific recommendations
    if season == 'spring':
        calendar['recommended_races'] = [
            {'distance': '5K', 'timing': 'Early spring', 'purpose': 'Fitness assessment'},
            {'distance': '10K', 'timing': 'Mid spring', 'purpose': 'Speed development'},
            {'distance': 'Half Marathon', 'timing': 'Late spring', 'purpose': 'Goal race'}
        ]
        calendar['training_phases'] = [
            'Base building (6-8 weeks)',
            'Speed development (4-6 weeks)',
            'Race preparation (2-3 weeks)'
        ]
    
    elif season == 'summer':
        calendar['recommended_races'] = [
            {'distance': 'Track 5K', 'timing': 'Early summer', 'purpose': 'Speed work'},
            {'distance': '10K', 'timing': 'Mid summer', 'purpose': 'Tempo fitness'},
            {'distance': 'Half Marathon', 'timing': 'Early fall', 'purpose': 'Goal race'}
        ]
    
    elif season == 'fall':
        calendar['recommended_races'] = [
            {'distance': '10K', 'timing': 'Early fall', 'purpose': 'Tune-up race'},
            {'distance': 'Half Marathon', 'timing': 'Mid fall', 'purpose': 'Primary goal'},
            {'distance': 'Marathon', 'timing': 'Late fall', 'purpose': 'Peak goal'}
        ]
    
    elif season == 'winter':
        calendar['recommended_races'] = [
            {'distance': 'Indoor 5K', 'timing': 'Mid winter', 'purpose': 'Maintain fitness'},
            {'distance': 'Holiday races', 'timing': 'Dec-Jan', 'purpose': 'Fun and motivation'},
            {'distance': 'Early spring prep', 'timing': 'Late winter', 'purpose': 'Season buildup'}
        ]
    
    # Focus-specific adjustments
    if focus == '5k':
        calendar['key_principles'] = [
            'Emphasize speed and VO2 max development',
            'Include weekly track sessions',
            'Race frequently for speed development'
        ]
    elif focus == 'marathon':
        calendar['key_principles'] = [
            'Build substantial aerobic base',
            'Include one marathon per season maximum',
            'Use half marathons as stepping stones'
        ]
    elif focus == 'trail':
        calendar['key_principles'] = [
            'Focus on time rather than pace goals',
            'Include varied terrain in training',
            'Emphasize hiking and power hiking skills'
        ]
    else:  # general
        calendar['key_principles'] = [
            'Build fitness progressively throughout season',
            'Use shorter races to prepare for longer ones',
            'Maintain variety to stay motivated'
        ]
    
    return calendar


def _analyze_race_performance(race_distance: float, race_seconds: int, race_date: datetime,
                             effort_level: str, user_data: Dict, pre_race_runs: List[Dict]) -> Dict:
    """Analyze post-race performance."""
    analysis = {
        'performance_rating': 'unknown',
        'pace_analysis': {},
        'fitness_impact': {},
        'lessons_learned': [],
        'future_recommendations': []
    }
    
    # Calculate race pace
    pace_per_mile = race_seconds / race_distance
    pace_minutes = int(pace_per_mile // 60)
    pace_seconds_remainder = int(pace_per_mile % 60)
    race_pace = f"{pace_minutes}:{pace_seconds_remainder:02d}"
    
    analysis['pace_analysis'] = {
        'race_pace': race_pace,
        'total_time': f"{race_seconds // 3600}:{(race_seconds % 3600) // 60:02d}:{race_seconds % 60:02d}",
        'pace_per_mile_seconds': round(pace_per_mile, 1)
    }
    
    # Compare to training paces
    if pre_race_runs:
        training_distances = [run['distance'] for run in pre_race_runs]
        avg_training_distance = sum(training_distances) / len(training_distances)
        
        # Simple performance rating based on effort and training
        if effort_level == 'maximum' and race_distance > avg_training_distance * 1.5:
            analysis['performance_rating'] = 'excellent'
            analysis['lessons_learned'].append('Great race execution for challenging distance')
        elif effort_level == 'maximum':
            analysis['performance_rating'] = 'good'
            analysis['lessons_learned'].append('Solid effort on race day')
        elif effort_level == 'hard':
            analysis['performance_rating'] = 'conservative'
            analysis['lessons_learned'].append('Room for more aggressive pacing')
        else:
            analysis['performance_rating'] = 'easy'
            analysis['lessons_learned'].append('Used race as training run')
    
    # Future recommendations based on performance
    if analysis['performance_rating'] == 'excellent':
        analysis['future_recommendations'] = [
            'Consider more aggressive goals for next race',
            'Build on this success with consistent training',
            'Look for longer or more challenging races'
        ]
    elif analysis['performance_rating'] == 'conservative':
        analysis['future_recommendations'] = [
            'Consider more aggressive race tactics',
            'Practice race pace in training',
            'Work on mental race preparation'
        ]
    else:
        analysis['future_recommendations'] = [
            'Continue current training approach',
            'Consider volume or intensity increases',
            'Set progressive goals for improvement'
        ]
    
    return analysis


def _calculate_optimal_splits(race_distance: float, goal_seconds: int, course_type: str) -> List[str]:
    """Calculate optimal mile splits for race strategy."""
    if goal_seconds <= 0:
        return ["Calculate based on goal pace"]
    
    target_pace = goal_seconds / race_distance
    splits = []
    
    # Adjust for course type and race distance
    if course_type == 'hilly':
        # Slower on hills, faster on flats
        for mile in range(int(race_distance)):
            if mile < race_distance * 0.3:  # First third
                split_pace = target_pace * 0.98  # Slightly faster
            elif mile < race_distance * 0.7:  # Middle third (hills)
                split_pace = target_pace * 1.05  # Slower for hills
            else:  # Final third
                split_pace = target_pace * 0.95  # Push the pace
            
            minutes = int(split_pace // 60)
            seconds = int(split_pace % 60)
            splits.append(f"{minutes}:{seconds:02d}")
    
    else:  # Flat course
        # Negative split strategy
        for mile in range(int(race_distance)):
            if mile < race_distance / 2:
                split_pace = target_pace * 1.02  # Slightly slower first half
            else:
                split_pace = target_pace * 0.98  # Faster second half
            
            minutes = int(split_pace // 60)
            seconds = int(split_pace % 60)
            splits.append(f"{minutes}:{seconds:02d}")
    
    return splits


def _define_effort_zones(race_distance: float) -> Dict:
    """Define effort zones for race strategy."""
    if race_distance <= 6.2:  # 10K or shorter
        return {
            'start': 'Controlled aggressive (85-90% effort)',
            'middle': 'Sustained hard (90-95% effort)',
            'finish': 'All out (95-100% effort)'
        }
    elif race_distance <= 13.1:  # Half marathon
        return {
            'start': 'Comfortable hard (80-85% effort)',
            'middle': 'Sustained tempo (85-90% effort)',
            'finish': 'Strong finish (90-95% effort)'
        }
    else:  # Marathon
        return {
            'start': 'Conversational plus (75-80% effort)',
            'middle': 'Controlled tempo (80-85% effort)',
            'finish': 'Whatever you have left (85-95% effort)'
        }


def _estimate_race_time(vdot: int, distance: float) -> str:
    """Estimate race time based on VDOT."""
    # Simplified VDOT-based time estimation
    # This is a basic implementation - real VDOT tables are more complex
    
    base_times = {
        5.0: 30 * 60,    # 30 minutes for VDOT 35
        10.0: 65 * 60,   # 65 minutes for VDOT 35
        13.1: 145 * 60,  # 2:25 for VDOT 35
        26.2: 310 * 60   # 5:10 for VDOT 35
    }
    
    if distance not in base_times:
        return "Unknown"
    
    # Adjust based on VDOT (simplified)
    vdot_factor = 35 / max(vdot, 20)  # Avoid division by zero
    estimated_seconds = base_times[distance] * vdot_factor
    
    hours = int(estimated_seconds // 3600)
    minutes = int((estimated_seconds % 3600) // 60)
    seconds = int(estimated_seconds % 60)
    
    if hours > 0:
        return f"{hours}:{minutes:02d}:{seconds:02d}"
    else:
        return f"{minutes}:{seconds:02d}"


# =============================================================================
# FORMATTING FUNCTIONS
# =============================================================================

def _format_race_strategy(strategy: Dict, race_distance: float, goal_time: str, 
                         race_date: str, course_type: str) -> str:
    """Format comprehensive race strategy."""
    result = f"🏁 Race Strategy Plan\n\n"
    result += f"📏 **Distance:** {race_distance} miles ({course_type} course)\n"
    result += f"🎯 **Goal Time:** {goal_time}\n"
    result += f"📅 **Race Date:** {race_date}\n\n"
    
    # Pacing plan
    pacing = strategy.get('pacing_plan', {})
    if pacing:
        result += "⏱️ **Pacing Strategy:**\n"
        result += f"• Target pace: {pacing.get('target_pace', 'Calculate from goal')}\n"
        result += f"• Start strategy: {pacing.get('start_strategy', 'Conservative')}\n"
        
        if 'effort_zones' in pacing:
            effort_zones = pacing['effort_zones']
            result += f"• Start effort: {effort_zones.get('start', 'Controlled')}\n"
            result += f"• Middle effort: {effort_zones.get('middle', 'Sustained')}\n"
            result += f"• Finish effort: {effort_zones.get('finish', 'Strong')}\n"
        result += "\n"
    
    # Fueling strategy
    fuel = strategy.get('fuel_strategy', {})
    if fuel:
        result += "🍌 **Fueling Strategy:**\n"
        for key, value in fuel.items():
            result += f"• {key.replace('_', ' ').title()}: {value}\n"
        result += "\n"
    
    # Taper plan
    taper = strategy.get('taper_plan', {})
    if taper:
        result += "📉 **Taper Plan:**\n"
        for key, value in taper.items():
            result += f"• {key.replace('_', ' ').title()}: {value}\n"
        result += "\n"
    
    # Race day tips
    if strategy.get('race_day_tips'):
        result += "💡 **Race Day Tips:**\n"
        for tip in strategy['race_day_tips']:
            result += f"• {tip}\n"
    
    result += "\n🎯 **Remember:** The best race plan is one you've practiced in training!"
    
    return result


def _format_race_readiness_analysis(readiness: Dict, race_distance: float, race_date: str) -> str:
    """Format race readiness analysis."""
    overall_score = readiness.get('overall_score', 0)
    
    # Determine readiness emoji
    if overall_score > 80:
        readiness_emoji = "🟢"
        readiness_text = "READY"
    elif overall_score > 60:
        readiness_emoji = "🟡"
        readiness_text = "MOSTLY READY"
    else:
        readiness_emoji = "🔴"
        readiness_text = "NEEDS WORK"
    
    result = f"🏁 Race Readiness Analysis\n\n"
    result += f"📏 **Race:** {race_distance} miles on {race_date}\n"
    result += f"{readiness_emoji} **Overall Readiness: {overall_score:.0f}% - {readiness_text}**\n\n"
    
    # Mileage readiness
    mileage = readiness.get('mileage_readiness', {})
    if mileage:
        result += "📊 **Training Volume:**\n"
        result += f"• Current weekly average: {mileage.get('current_weekly', 0)} miles\n"
        result += f"• Recommended for race: {mileage.get('target_weekly', 0)} miles\n"
        result += f"• Status: {mileage.get('status', 'unknown').title()}\n\n"
    
    # Long run preparation
    long_run_count = readiness.get('long_run_count', 0)
    result += f"🏃 **Long Run Preparation:** {long_run_count} runs > {race_distance * 0.6:.1f} miles\n"
    
    # Consistency
    consistency = readiness.get('consistency_score', 0)
    result += f"📈 **Training Consistency:** {consistency:.0f}%\n\n"
    
    # Recommendations
    recommendations = readiness.get('recommendations', [])
    if recommendations:
        result += "💡 **Recommendations:**\n"
        for rec in recommendations:
            result += f"• {rec}\n"
        result += "\n"
    
    # Risk factors
    risk_factors = readiness.get('risk_factors', [])
    if risk_factors:
        result += "⚠️ **Risk Factors:**\n"
        for risk in risk_factors:
            result += f"• {risk}\n"
        result += "\n"
    
    result += "🎯 **Bottom Line:** Focus on consistency and listen to your body as race day approaches!"
    
    return result


def _format_benchmark_analysis(analysis: Dict, time_period: str, num_runs: int) -> str:
    """Format performance benchmarking analysis."""
    result = f"📊 Performance Benchmarking ({time_period})\n\n"
    result += f"📈 **Analysis based on {num_runs} runs**\n\n"
    
    # Distance trends
    distance_trends = analysis.get('distance_trends', {})
    if distance_trends:
        result += "🏃 **Distance Analysis:**\n"
        result += f"• Total distance: {distance_trends.get('total_distance', 0)} miles\n"
        result += f"• Average run: {distance_trends.get('avg_distance', 0)} miles\n"
        result += f"• Longest run: {distance_trends.get('max_distance', 0)} miles\n"
        result += f"• Long runs (>8 miles): {distance_trends.get('long_run_percentage', 0)}%\n\n"
    
    # Performance metrics
    metrics = analysis.get('performance_metrics', {})
    if metrics:
        result += "🎯 **Current Performance Level:**\n"
        result += f"• Training level: {metrics.get('training_level', 'unknown').title()}\n"
        result += f"• Estimated VDOT: {metrics.get('current_vdot', 'unknown')}\n"
        result += f"• Weekly mileage: {metrics.get('weekly_mileage', 0)} miles\n\n"
        
        # Race predictions
        predictions = metrics.get('race_predictions', {})
        if predictions:
            result += "🔮 **Estimated Race Times:**\n"
            for distance, time in predictions.items():
                result += f"• {distance}: {time}\n"
            result += "\n"
    
    # Volume trends
    volume_trends = analysis.get('volume_trends', {})
    if volume_trends:
        result += "📈 **Volume Trends:**\n"
        result += f"• Trend: {volume_trends.get('trend', 'stable').title()}\n"
        result += f"• Monthly average: {volume_trends.get('monthly_avg', 0)} miles\n"
        result += f"• Peak month: {volume_trends.get('peak_month', 0)} miles\n\n"
    
    # Strengths
    strengths = analysis.get('strengths', [])
    if strengths:
        result += "💪 **Strengths:**\n"
        for strength in strengths:
            result += f"• {strength}\n"
        result += "\n"
    
    # Improvement areas
    improvements = analysis.get('improvement_areas', [])
    if improvements:
        result += "🎯 **Improvement Opportunities:**\n"
        for improvement in improvements:
            result += f"• {improvement}\n"
    
    result += "\n📊 **Insight:** Consistent benchmarking helps track progress and guide training decisions!"
    
    return result


def _format_race_calendar(calendar: Dict, season: str, focus: str) -> str:
    """Format race calendar plan."""
    result = f"📅 Race Calendar Plan - {season.title()} Season\n\n"
    result += f"🎯 **Focus:** {focus.title()}\n\n"
    
    # Recommended races
    races = calendar.get('recommended_races', [])
    if races:
        result += "🏁 **Recommended Race Schedule:**\n"
        for race in races:
            result += f"• {race.get('distance', 'Unknown')} - {race.get('timing', 'TBD')}\n"
            result += f"  Purpose: {race.get('purpose', 'Training')}\n"
        result += "\n"
    
    # Training phases
    phases = calendar.get('training_phases', [])
    if phases:
        result += "📈 **Training Phases:**\n"
        for i, phase in enumerate(phases, 1):
            result += f"{i}. {phase}\n"
        result += "\n"
    
    # Key principles
    principles = calendar.get('key_principles', [])
    if principles:
        result += "💡 **Key Training Principles:**\n"
        for principle in principles:
            result += f"• {principle}\n"
    
    result += "\n🗓️ **Planning Tip:** Book races early and build training around your target events!"
    
    return result


def _format_post_race_analysis(analysis: Dict, race_distance: float, race_time: str, race_date: str) -> str:
    """Format post-race performance analysis."""
    result = f"🏁 Post-Race Analysis\n\n"
    result += f"📏 **Race:** {race_distance} miles on {race_date}\n"
    result += f"⏱️ **Time:** {race_time}\n\n"
    
    # Pace analysis
    pace_analysis = analysis.get('pace_analysis', {})
    if pace_analysis:
        result += "⏱️ **Pace Analysis:**\n"
        result += f"• Average pace: {pace_analysis.get('race_pace', 'Unknown')}\n"
        result += f"• Total time: {pace_analysis.get('total_time', race_time)}\n\n"
    
    # Performance rating
    performance = analysis.get('performance_rating', 'unknown')
    performance_emoji = {
        'excellent': '🌟',
        'good': '👍',
        'conservative': '⚠️',
        'easy': '😊'
    }.get(performance, '❓')
    
    result += f"{performance_emoji} **Performance Rating:** {performance.title()}\n\n"
    
    # Lessons learned
    lessons = analysis.get('lessons_learned', [])
    if lessons:
        result += "📚 **Lessons Learned:**\n"
        for lesson in lessons:
            result += f"• {lesson}\n"
        result += "\n"
    
    # Future recommendations
    recommendations = analysis.get('future_recommendations', [])
    if recommendations:
        result += "🎯 **Future Recommendations:**\n"
        for rec in recommendations:
            result += f"• {rec}\n"
    
    result += "\n🏃 **Remember:** Every race is a learning opportunity for future improvement!"
    
    return result