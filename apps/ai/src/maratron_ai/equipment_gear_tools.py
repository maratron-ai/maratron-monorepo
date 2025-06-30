"""Equipment & Gear Management MCP Tools for Comprehensive Running Gear Optimization

This module provides sophisticated tools for equipment management, gear recommendations,
maintenance tracking, and optimization strategies beyond basic shoe tracking.
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
# EQUIPMENT & GEAR MANAGEMENT TOOLS
# =============================================================================

@handle_database_errors
@require_user_context
async def analyze_shoe_rotation_tool() -> str:
    """Analyze shoe rotation patterns and provide optimization recommendations."""
    try:
        user_id = get_current_user_id()
        pool = await get_pool()
        
        # Get all user shoes with run data
        shoes = await fetch_with_timeout(
            pool,
            'SELECT * FROM "Shoes" WHERE "userId"=$1 ORDER BY "createdAt" DESC',
            user_id
        )
        
        if not shoes:
            return "👟 Shoe Rotation Analysis\n\n" + \
                   "No shoes found in your collection.\n" + \
                   "Add some shoes using addShoe() to get rotation analysis!"
        
        # Get recent runs with shoe data
        recent_runs = await fetch_with_timeout(
            pool,
            'SELECT r.*, s.name as shoe_name FROM "Runs" r ' + \
            'LEFT JOIN "Shoes" s ON r."shoeId" = s.id ' + \
            'WHERE r."userId"=$1 AND r.date >= NOW() - INTERVAL \'60 days\' ' + \
            'ORDER BY r.date DESC',
            user_id
        )
        
        # Analyze rotation patterns
        rotation_analysis = _analyze_rotation_patterns(shoes, recent_runs)
        optimization_advice = _generate_rotation_optimization(rotation_analysis, shoes)
        
        return _format_shoe_rotation_analysis(rotation_analysis, optimization_advice, len(shoes))
        
    except Exception as e:
        return f"Error analyzing shoe rotation: {str(e)}"


@handle_database_errors
@require_user_context
async def get_gear_recommendations_tool(scenario: str = "general", season: str = "current") -> str:
    """Get intelligent gear recommendations based on training goals and conditions.
    
    Args:
        scenario: Training scenario ('racing', 'long_runs', 'speed_work', 'trails', 'weather', 'general')
        season: Season for recommendations ('spring', 'summer', 'fall', 'winter', 'current')
    """
    try:
        user_id = get_current_user_id()
        pool = await get_pool()
        
        # Get user profile and recent runs
        user_data = await fetchrow_with_timeout(
            pool,
            'SELECT * FROM "Users" WHERE id=$1',
            user_id
        )
        
        recent_runs = await fetch_with_timeout(
            pool,
            'SELECT * FROM "Runs" WHERE "userId"=$1 ORDER BY date DESC LIMIT 15',
            user_id
        )
        
        current_shoes = await fetch_with_timeout(
            pool,
            'SELECT * FROM "Shoes" WHERE "userId"=$1 AND retired=false',
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
        
        # Generate gear recommendations
        recommendations = _generate_gear_recommendations(scenario, season, user_data, recent_runs, current_shoes)
        
        return _format_gear_recommendations(recommendations, scenario, season)
        
    except Exception as e:
        return f"Error generating gear recommendations: {str(e)}"


@handle_database_errors
@require_user_context
async def track_equipment_maintenance_tool(equipment_type: str = "shoes") -> str:
    """Track equipment maintenance needs and provide scheduling recommendations.
    
    Args:
        equipment_type: Type of equipment to track ('shoes', 'all')
    """
    try:
        user_id = get_current_user_id()
        pool = await get_pool()
        
        if equipment_type == "shoes" or equipment_type == "all":
            # Get shoes and analyze maintenance needs
            shoes = await fetch_with_timeout(
                pool,
                'SELECT * FROM "Shoes" WHERE "userId"=$1',
                user_id
            )
            
            if not shoes:
                return "🔧 Equipment Maintenance Tracker\n\n" + \
                       "No equipment found to track.\n" + \
                       "Add some shoes to start tracking maintenance needs!"
            
            # Analyze maintenance needs
            maintenance_analysis = _analyze_equipment_maintenance(shoes)
            
            return _format_maintenance_analysis(maintenance_analysis, equipment_type)
        
        return f"Equipment type '{equipment_type}' not yet supported. Currently supporting: shoes"
        
    except Exception as e:
        return f"Error tracking equipment maintenance: {str(e)}"


@handle_database_errors
@require_user_context
async def optimize_gear_selection_tool(run_type: str = "general", distance: float = 5.0) -> str:
    """Get optimized gear selection recommendations for specific runs.
    
    Args:
        run_type: Type of run ('easy', 'tempo', 'intervals', 'long', 'race', 'recovery')
        distance: Distance of the planned run
    """
    try:
        user_id = get_current_user_id()
        pool = await get_pool()
        
        # Get user's current shoes
        shoes = await fetch_with_timeout(
            pool,
            'SELECT * FROM "Shoes" WHERE "userId"=$1 AND retired=false ORDER BY "currentDistance" ASC',
            user_id
        )
        
        user_data = await fetchrow_with_timeout(
            pool,
            'SELECT * FROM "Users" WHERE id=$1',
            user_id
        )
        
        recent_runs = await fetch_with_timeout(
            pool,
            'SELECT * FROM "Runs" WHERE "userId"=$1 ORDER BY date DESC LIMIT 10',
            user_id
        )
        
        if not shoes:
            return f"👟 Gear Selection for {run_type.title()} Run ({distance} miles)\n\n" + \
                   "No active shoes found in your collection.\n" + \
                   "Add some shoes to get gear selection recommendations!"
        
        # Generate gear selection advice
        selection_advice = _generate_gear_selection_advice(run_type, distance, shoes, user_data, recent_runs)
        
        return _format_gear_selection_advice(selection_advice, run_type, distance)
        
    except Exception as e:
        return f"Error optimizing gear selection: {str(e)}"


@handle_database_errors
@require_user_context
async def plan_equipment_lifecycle_tool() -> str:
    """Plan equipment lifecycle and replacement strategies."""
    try:
        user_id = get_current_user_id()
        pool = await get_pool()
        
        # Get all shoes and usage patterns
        shoes = await fetch_with_timeout(
            pool,
            'SELECT * FROM "Shoes" WHERE "userId"=$1 ORDER BY "createdAt" DESC',
            user_id
        )
        
        user_data = await fetchrow_with_timeout(
            pool,
            'SELECT * FROM "Users" WHERE id=$1',
            user_id
        )
        
        recent_runs = await fetch_with_timeout(
            pool,
            'SELECT * FROM "Runs" WHERE "userId"=$1 AND date >= NOW() - INTERVAL \'90 days\'',
            user_id
        )
        
        if not shoes:
            return "📅 Equipment Lifecycle Planning\n\n" + \
                   "No shoes found to analyze.\n" + \
                   "Add some shoes to get lifecycle planning advice!"
        
        # Analyze equipment lifecycle
        lifecycle_analysis = _analyze_equipment_lifecycle(shoes, user_data, recent_runs)
        
        return _format_lifecycle_analysis(lifecycle_analysis)
        
    except Exception as e:
        return f"Error planning equipment lifecycle: {str(e)}"


# =============================================================================
# ANALYSIS HELPER FUNCTIONS
# =============================================================================

def _analyze_rotation_patterns(shoes: List[Dict], recent_runs: List[Dict]) -> Dict:
    """Analyze shoe rotation patterns and usage."""
    analysis = {
        'total_shoes': len(shoes),
        'active_shoes': len([s for s in shoes if not s['retired']]),
        'shoe_usage': {},
        'rotation_health': 'unknown',
        'usage_patterns': {}
    }
    
    # Analyze individual shoe usage
    for shoe in shoes:
        shoe_id = shoe['id']
        shoe_name = shoe['name']
        
        # Count runs with this shoe
        shoe_runs = [run for run in recent_runs if run.get('shoeId') == shoe_id]
        
        usage_percentage = shoe['currentDistance'] / shoe['maxDistance'] * 100 if shoe['maxDistance'] > 0 else 0
        
        analysis['shoe_usage'][shoe_name] = {
            'current_distance': shoe['currentDistance'],
            'max_distance': shoe['maxDistance'],
            'usage_percentage': round(usage_percentage, 1),
            'recent_runs': len(shoe_runs),
            'retired': shoe['retired'],
            'days_since_created': (datetime.now() - shoe['createdAt']).days
        }
    
    # Analyze rotation health
    active_shoes = [s for s in shoes if not s['retired']]
    if len(active_shoes) >= 2:
        # Check if usage is distributed
        recent_shoe_usage = {}
        for run in recent_runs:
            shoe_id = run.get('shoeId')
            if shoe_id:
                recent_shoe_usage[shoe_id] = recent_shoe_usage.get(shoe_id, 0) + 1
        
        if len(recent_shoe_usage) > 1:
            analysis['rotation_health'] = 'good'
        else:
            analysis['rotation_health'] = 'single_shoe_dependency'
    elif len(active_shoes) == 1:
        analysis['rotation_health'] = 'single_shoe'
    else:
        analysis['rotation_health'] = 'no_active_shoes'
    
    return analysis


def _generate_rotation_optimization(analysis: Dict, shoes: List[Dict]) -> List[str]:
    """Generate shoe rotation optimization recommendations."""
    recommendations = []
    
    rotation_health = analysis.get('rotation_health', 'unknown')
    active_shoes = analysis.get('active_shoes', 0)
    
    if rotation_health == 'single_shoe':
        recommendations.extend([
            "Consider adding a second pair of shoes for rotation",
            "Rotating between shoes reduces injury risk and extends shoe life",
            "Different shoes can provide variety in cushioning and support"
        ])
    elif rotation_health == 'single_shoe_dependency':
        recommendations.extend([
            "You have multiple shoes but are mainly using one",
            "Try rotating between your shoes more regularly",
            "Use different shoes for different types of runs"
        ])
    elif rotation_health == 'good':
        recommendations.append("Good shoe rotation pattern - keep it up!")
    
    # Check for shoes nearing retirement
    shoe_usage = analysis.get('shoe_usage', {})
    for shoe_name, usage in shoe_usage.items():
        if usage['usage_percentage'] > 80 and not usage['retired']:
            recommendations.append(f"{shoe_name} is at {usage['usage_percentage']:.0f}% usage - plan replacement soon")
        elif usage['usage_percentage'] > 90 and not usage['retired']:
            recommendations.append(f"{shoe_name} is at {usage['usage_percentage']:.0f}% usage - retire immediately")
    
    # Recommend optimal number of shoes
    if active_shoes < 2:
        recommendations.append("Ideal rotation includes 2-3 pairs of shoes for different purposes")
    elif active_shoes > 4:
        recommendations.append("Consider focusing on 2-3 primary shoes to ensure adequate break-in")
    
    return recommendations or ["Current shoe rotation looks well-managed"]


def _generate_gear_recommendations(scenario: str, season: str, user_data: Dict, 
                                  recent_runs: List[Dict], current_shoes: List[Dict]) -> Dict:
    """Generate comprehensive gear recommendations."""
    recommendations = {
        'priority_items': [],
        'clothing': [],
        'accessories': [],
        'shoes': [],
        'seasonal_specific': [],
        'scenario_specific': []
    }
    
    # Scenario-specific recommendations
    if scenario == 'racing':
        recommendations['priority_items'] = ['Racing flats or lightweight trainers', 'Race-day outfit (tested in training)']
        recommendations['clothing'] = ['Lightweight, moisture-wicking racing singlet', 'Racing shorts with minimal seams']
        recommendations['accessories'] = ['GPS watch with race features', 'Race belt for bib/fuel']
        recommendations['shoes'] = ['Dedicated racing shoes (carbon plate optional)', 'Backup racing shoes']
        recommendations['scenario_specific'] = [
            'Never wear anything new on race day',
            'Practice fuel and hydration strategy',
            'Prepare gear the night before'
        ]
    
    elif scenario == 'long_runs':
        recommendations['priority_items'] = ['Hydration system', 'Cushioned running shoes']
        recommendations['clothing'] = ['Comfortable, chafe-resistant clothing', 'Layers for temperature changes']
        recommendations['accessories'] = ['Hydration belt/vest', 'Fuel/energy gels', 'Blister prevention']
        recommendations['shoes'] = ['Maximum cushioned trainers', 'Well-broken-in shoes']
        recommendations['scenario_specific'] = [
            'Test all gear on shorter runs first',
            'Plan nutrition and hydration strategy',
            'Consider anti-chafing products'
        ]
    
    elif scenario == 'speed_work':
        recommendations['priority_items'] = ['Lightweight, responsive shoes', 'Form-fitting clothing']
        recommendations['clothing'] = ['Minimal, non-restrictive clothing', 'Compression wear (optional)']
        recommendations['accessories'] = ['Interval timer/watch', 'Track spikes (if on track)']
        recommendations['shoes'] = ['Tempo/speed training shoes', 'Track spikes for track work']
        recommendations['scenario_specific'] = [
            'Prioritize fit and responsiveness over cushioning',
            'Ensure gear won\'t interfere with form',
            'Consider minimalist approach'
        ]
    
    elif scenario == 'trails':
        recommendations['priority_items'] = ['Trail running shoes', 'Navigation tools']
        recommendations['clothing'] = ['Durable, snag-resistant clothing', 'Layering system']
        recommendations['accessories'] = ['GPS watch/phone', 'First aid basics', 'Headlamp (if needed)']
        recommendations['shoes'] = ['Trail shoes with appropriate tread', 'Gaiters for debris protection']
        recommendations['scenario_specific'] = [
            'Prioritize traction and protection',
            'Carry safety essentials',
            'Inform others of your route'
        ]
    
    elif scenario == 'weather':
        if season == 'winter':
            recommendations['priority_items'] = ['Wind/water-resistant jacket', 'Traction devices']
            recommendations['clothing'] = ['Layering system', 'Moisture-wicking base layer', 'Wind-resistant outer layer']
            recommendations['accessories'] = ['Reflective gear', 'Hand/foot warmers', 'Balaclava/buff']
        elif season == 'summer':
            recommendations['priority_items'] = ['Sun protection', 'Hydration system']
            recommendations['clothing'] = ['Light-colored, UPF clothing', 'Minimal coverage options']
            recommendations['accessories'] = ['Hat/visor', 'Sunglasses', 'Electrolyte replacement']
    
    # Season-specific additions
    if season == 'spring':
        recommendations['seasonal_specific'] = [
            'Lightweight jacket for variable weather',
            'Waterproof shoes for wet conditions',
            'Layers for temperature swings'
        ]
    elif season == 'summer':
        recommendations['seasonal_specific'] = [
            'UV protection clothing',
            'Cooling towels',
            'Early morning/evening reflective gear'
        ]
    elif season == 'fall':
        recommendations['seasonal_specific'] = [
            'Reflective gear for shorter days',
            'Shoes with good traction for leaves',
            'Layering system for temperature drops'
        ]
    elif season == 'winter':
        recommendations['seasonal_specific'] = [
            'Traction devices for ice/snow',
            'Thermal base layers',
            'Wind and water protection'
        ]
    
    return recommendations


def _analyze_equipment_maintenance(shoes: List[Dict]) -> Dict:
    """Analyze equipment maintenance needs."""
    maintenance = {
        'immediate_attention': [],
        'upcoming_maintenance': [],
        'replacement_needed': [],
        'good_condition': [],
        'maintenance_schedule': {}
    }
    
    for shoe in shoes:
        shoe_name = shoe['name']
        usage_percentage = (shoe['currentDistance'] / shoe['maxDistance'] * 100) if shoe['maxDistance'] > 0 else 0
        days_old = (datetime.now() - shoe['createdAt']).days
        
        shoe_info = {
            'name': shoe_name,
            'usage_percentage': round(usage_percentage, 1),
            'current_distance': shoe['currentDistance'],
            'max_distance': shoe['maxDistance'],
            'days_old': days_old,
            'retired': shoe['retired']
        }
        
        if shoe['retired']:
            continue  # Skip retired shoes
        elif usage_percentage > 90:
            maintenance['replacement_needed'].append(shoe_info)
        elif usage_percentage > 75:
            maintenance['upcoming_maintenance'].append(shoe_info)
        elif days_old > 365:  # Over a year old
            maintenance['immediate_attention'].append(shoe_info)
        else:
            maintenance['good_condition'].append(shoe_info)
    
    # Generate maintenance schedule
    for shoe in shoes:
        if not shoe['retired']:
            remaining_miles = shoe['maxDistance'] - shoe['currentDistance']
            if remaining_miles > 0:
                maintenance['maintenance_schedule'][shoe['name']] = {
                    'remaining_miles': round(remaining_miles, 1),
                    'estimated_weeks': round(remaining_miles / 10, 1)  # Assuming ~10 miles/week
                }
    
    return maintenance


def _generate_gear_selection_advice(run_type: str, distance: float, shoes: List[Dict], 
                                   user_data: Dict, recent_runs: List[Dict]) -> Dict:
    """Generate gear selection advice for specific run."""
    advice = {
        'recommended_shoe': None,
        'reasoning': [],
        'alternatives': [],
        'general_advice': []
    }
    
    # Analyze shoe suitability for run type
    shoe_scores = []
    for shoe in shoes:
        score = 0
        reasoning = []
        
        # Usage-based scoring
        usage_percentage = (shoe['currentDistance'] / shoe['maxDistance'] * 100) if shoe['maxDistance'] > 0 else 0
        
        if usage_percentage < 25:  # New shoes
            if run_type in ['easy', 'recovery']:
                score += 2
                reasoning.append("Good for easy runs to break in")
            else:
                score -= 1
                reasoning.append("May need more break-in time")
        elif usage_percentage > 80:  # High-usage shoes
            if run_type in ['easy', 'recovery']:
                score += 1
                reasoning.append("Suitable for easy runs despite high usage")
            else:
                score -= 2
                reasoning.append("High usage may affect performance")
        else:  # Optimal usage range
            score += 3
            reasoning.append("Optimal usage range for all run types")
        
        # Distance-based scoring
        if distance > 10:  # Long runs
            if 'cushion' in shoe['name'].lower() or 'max' in shoe['name'].lower():
                score += 2
                reasoning.append("Good cushioning for long distance")
        elif distance < 3:  # Short runs
            if 'light' in shoe['name'].lower() or 'speed' in shoe['name'].lower():
                score += 1
                reasoning.append("Lightweight for shorter distances")
        
        # Run type specific scoring
        if run_type in ['tempo', 'intervals']:
            if 'speed' in shoe['name'].lower() or 'tempo' in shoe['name'].lower():
                score += 2
                reasoning.append("Designed for speed work")
        elif run_type == 'race':
            if 'race' in shoe['name'].lower() or 'carbon' in shoe['name'].lower():
                score += 3
                reasoning.append("Racing-specific features")
        
        shoe_scores.append({
            'shoe': shoe,
            'score': score,
            'reasoning': reasoning
        })
    
    # Sort by score and select best
    shoe_scores.sort(key=lambda x: x['score'], reverse=True)
    
    if shoe_scores:
        best_shoe = shoe_scores[0]
        advice['recommended_shoe'] = best_shoe['shoe']['name']
        advice['reasoning'] = best_shoe['reasoning']
        
        # Add alternatives
        for i in range(1, min(3, len(shoe_scores))):
            advice['alternatives'].append({
                'name': shoe_scores[i]['shoe']['name'],
                'reasoning': shoe_scores[i]['reasoning'][:1]  # Just top reason
            })
    
    # General advice
    advice['general_advice'] = [
        f"For {run_type} runs, prioritize comfort and appropriate cushioning",
        f"At {distance} miles, ensure your shoes are well broken-in",
        "Rotate between shoes to extend their lifespan"
    ]
    
    return advice


def _analyze_equipment_lifecycle(shoes: List[Dict], user_data: Dict, recent_runs: List[Dict]) -> Dict:
    """Analyze equipment lifecycle and plan replacements."""
    lifecycle = {
        'replacement_timeline': {},
        'current_inventory': {},
        'optimization_advice': [],
        'budget_planning': {}
    }
    
    # Analyze current inventory
    active_shoes = [s for s in shoes if not s['retired']]
    retired_shoes = [s for s in shoes if s['retired']]
    
    lifecycle['current_inventory'] = {
        'active_count': len(active_shoes),
        'retired_count': len(retired_shoes),
        'total_value': len(shoes) * 120,  # Rough estimate
        'age_distribution': {}
    }
    
    # Calculate weekly mileage for projections
    if recent_runs:
        days_span = (recent_runs[0]['date'] - recent_runs[-1]['date']).days + 1
        weekly_mileage = (sum(run['distance'] for run in recent_runs) / days_span) * 7
    else:
        weekly_mileage = 20  # Default assumption
    
    # Project replacement timeline
    for shoe in active_shoes:
        remaining_miles = shoe['maxDistance'] - shoe['currentDistance']
        weeks_remaining = remaining_miles / weekly_mileage if weekly_mileage > 0 else 0
        
        lifecycle['replacement_timeline'][shoe['name']] = {
            'weeks_remaining': max(0, round(weeks_remaining, 1)),
            'replacement_date': datetime.now() + timedelta(weeks=max(0, weeks_remaining)),
            'urgency': 'high' if weeks_remaining < 4 else 'medium' if weeks_remaining < 12 else 'low'
        }
    
    # Generate optimization advice
    if len(active_shoes) < 2:
        lifecycle['optimization_advice'].append("Consider maintaining 2-3 active shoes for rotation")
    
    urgent_replacements = sum(1 for timeline in lifecycle['replacement_timeline'].values() 
                            if timeline['urgency'] == 'high')
    if urgent_replacements > 0:
        lifecycle['optimization_advice'].append(f"Plan to replace {urgent_replacements} shoes in the next month")
    
    # Budget planning
    annual_shoe_cost = (52 * weekly_mileage / 300) * 120  # Rough calculation
    lifecycle['budget_planning'] = {
        'estimated_annual_cost': round(annual_shoe_cost, 0),
        'recommended_budget': round(annual_shoe_cost * 1.2, 0),  # 20% buffer
        'cost_per_mile': round(120 / 300, 2)  # Assuming $120 shoes, 300-mile life
    }
    
    return lifecycle


# =============================================================================
# FORMATTING FUNCTIONS
# =============================================================================

def _format_shoe_rotation_analysis(analysis: Dict, recommendations: List[str], num_shoes: int) -> str:
    """Format shoe rotation analysis."""
    result = "👟 Shoe Rotation Analysis\n\n"
    result += f"📊 **Your Collection:** {analysis['total_shoes']} shoes ({analysis['active_shoes']} active)\n"
    result += f"🔄 **Rotation Health:** {analysis['rotation_health'].replace('_', ' ').title()}\n\n"
    
    # Individual shoe breakdown
    result += "👟 **Individual Shoe Status:**\n"
    shoe_usage = analysis.get('shoe_usage', {})
    for shoe_name, usage in shoe_usage.items():
        status_emoji = "🟥" if usage['usage_percentage'] > 90 else "🟨" if usage['usage_percentage'] > 75 else "🟩"
        retired_note = " (Retired)" if usage['retired'] else ""
        
        result += f"{status_emoji} {shoe_name}: {usage['usage_percentage']:.0f}% used "
        result += f"({usage['current_distance']}/{usage['max_distance']} miles){retired_note}\n"
    
    result += "\n💡 **Optimization Recommendations:**\n"
    for rec in recommendations:
        result += f"• {rec}\n"
    
    result += "\n🎯 **Pro Tip:** Rotating shoes reduces injury risk and extends shoe lifespan!"
    
    return result


def _format_gear_recommendations(recommendations: Dict, scenario: str, season: str) -> str:
    """Format gear recommendations."""
    result = f"🎽 Gear Recommendations - {scenario.title()} ({season.title()})\n\n"
    
    if recommendations['priority_items']:
        result += "🔥 **Priority Items:**\n"
        for item in recommendations['priority_items']:
            result += f"• {item}\n"
        result += "\n"
    
    if recommendations['shoes']:
        result += "👟 **Footwear:**\n"
        for shoe in recommendations['shoes']:
            result += f"• {shoe}\n"
        result += "\n"
    
    if recommendations['clothing']:
        result += "👕 **Clothing:**\n"
        for clothing in recommendations['clothing']:
            result += f"• {clothing}\n"
        result += "\n"
    
    if recommendations['accessories']:
        result += "🎒 **Accessories:**\n"
        for accessory in recommendations['accessories']:
            result += f"• {accessory}\n"
        result += "\n"
    
    if recommendations['seasonal_specific']:
        result += f"🌤️ **{season.title()} Specific:**\n"
        for item in recommendations['seasonal_specific']:
            result += f"• {item}\n"
        result += "\n"
    
    if recommendations['scenario_specific']:
        result += f"🎯 **{scenario.title()} Tips:**\n"
        for tip in recommendations['scenario_specific']:
            result += f"• {tip}\n"
    
    result += "\n💡 **Remember:** The best gear is gear that's tested and comfortable for YOU!"
    
    return result


def _format_maintenance_analysis(maintenance: Dict, equipment_type: str) -> str:
    """Format equipment maintenance analysis."""
    result = f"🔧 Equipment Maintenance Tracker ({equipment_type.title()})\n\n"
    
    if maintenance['replacement_needed']:
        result += "🚨 **Immediate Replacement Needed:**\n"
        for item in maintenance['replacement_needed']:
            result += f"• {item['name']}: {item['usage_percentage']:.0f}% used ({item['current_distance']}/{item['max_distance']} miles)\n"
        result += "\n"
    
    if maintenance['upcoming_maintenance']:
        result += "⚠️ **Replacement Soon:**\n"
        for item in maintenance['upcoming_maintenance']:
            result += f"• {item['name']}: {item['usage_percentage']:.0f}% used ({item['current_distance']}/{item['max_distance']} miles)\n"
        result += "\n"
    
    if maintenance['immediate_attention']:
        result += "👀 **Review Needed:**\n"
        for item in maintenance['immediate_attention']:
            result += f"• {item['name']}: {item['days_old']} days old\n"
        result += "\n"
    
    if maintenance['good_condition']:
        result += "✅ **Good Condition:**\n"
        for item in maintenance['good_condition']:
            result += f"• {item['name']}: {item['usage_percentage']:.0f}% used\n"
        result += "\n"
    
    if maintenance['maintenance_schedule']:
        result += "📅 **Replacement Schedule:**\n"
        for name, schedule in maintenance['maintenance_schedule'].items():
            result += f"• {name}: ~{schedule['estimated_weeks']:.0f} weeks remaining ({schedule['remaining_miles']} miles)\n"
    
    result += "\n🎯 **Maintenance Tip:** Track usage to optimize replacement timing and budget!"
    
    return result


def _format_gear_selection_advice(advice: Dict, run_type: str, distance: float) -> str:
    """Format gear selection advice."""
    result = f"👟 Gear Selection for {run_type.title()} Run ({distance} miles)\n\n"
    
    if advice['recommended_shoe']:
        result += f"🥇 **Recommended:** {advice['recommended_shoe']}\n"
        if advice['reasoning']:
            result += "**Why:**\n"
            for reason in advice['reasoning']:
                result += f"• {reason}\n"
        result += "\n"
    
    if advice['alternatives']:
        result += "🥈 **Alternatives:**\n"
        for alt in advice['alternatives']:
            result += f"• {alt['name']}"
            if alt['reasoning']:
                result += f" - {alt['reasoning'][0]}"
            result += "\n"
        result += "\n"
    
    if advice['general_advice']:
        result += "💡 **General Advice:**\n"
        for tip in advice['general_advice']:
            result += f"• {tip}\n"
    
    result += "\n🎯 **Remember:** Listen to your body and adjust gear choice based on how you feel!"
    
    return result


def _format_lifecycle_analysis(lifecycle: Dict) -> str:
    """Format equipment lifecycle analysis."""
    result = "📅 Equipment Lifecycle Planning\n\n"
    
    # Current inventory
    inventory = lifecycle['current_inventory']
    result += f"📦 **Current Inventory:** {inventory['active_count']} active, {inventory['retired_count']} retired\n\n"
    
    # Replacement timeline
    if lifecycle['replacement_timeline']:
        result += "⏰ **Replacement Timeline:**\n"
        for shoe_name, timeline in lifecycle['replacement_timeline'].items():
            urgency_emoji = "🚨" if timeline['urgency'] == 'high' else "⚠️" if timeline['urgency'] == 'medium' else "✅"
            result += f"{urgency_emoji} {shoe_name}: {timeline['weeks_remaining']:.0f} weeks remaining\n"
        result += "\n"
    
    # Optimization advice
    if lifecycle['optimization_advice']:
        result += "🔧 **Optimization Advice:**\n"
        for advice in lifecycle['optimization_advice']:
            result += f"• {advice}\n"
        result += "\n"
    
    # Budget planning
    budget = lifecycle['budget_planning']
    result += "💰 **Budget Planning:**\n"
    result += f"• Estimated annual cost: ${budget['estimated_annual_cost']:.0f}\n"
    result += f"• Recommended budget: ${budget['recommended_budget']:.0f}\n"
    result += f"• Cost per mile: ${budget['cost_per_mile']:.2f}\n"
    
    result += "\n📋 **Pro Tip:** Plan shoe purchases during sales to optimize your running budget!"
    
    return result