"""Weather tools for running optimization and safety."""
import asyncio
import aiohttp
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional, Any, Tuple
from .config import get_config
from .database_utils import handle_database_errors
from .user_context.context import get_current_user_id
from .user_context.tools import get_user_distance_unit

logger = logging.getLogger(__name__)

# Weather data cache
_weather_cache: Dict[str, Dict[str, Any]] = {}
_cache_timestamps: Dict[str, datetime] = {}


class WeatherAPIError(Exception):
    """Custom exception for weather API errors."""
    pass


async def _get_weather_api_key() -> Optional[str]:
    """Get weather API key from configuration."""
    config = get_config()
    return config.weather.api_key


async def _is_cache_valid(cache_key: str) -> bool:
    """Check if cached weather data is still valid."""
    if cache_key not in _cache_timestamps:
        return False
    
    config = get_config()
    cache_age = datetime.now() - _cache_timestamps[cache_key]
    return cache_age.total_seconds() < (config.weather.cache_ttl_minutes * 60)


async def _get_cached_weather(cache_key: str) -> Optional[Dict[str, Any]]:
    """Get cached weather data if valid."""
    if await _is_cache_valid(cache_key):
        return _weather_cache.get(cache_key)
    return None


async def _cache_weather_data(cache_key: str, data: Dict[str, Any]) -> None:
    """Cache weather data with timestamp."""
    _weather_cache[cache_key] = data
    _cache_timestamps[cache_key] = datetime.now()


async def _get_user_location() -> Optional[str]:
    """Get user's location from their profile or preferences."""
    try:
        user_id = get_current_user_id()
        if not user_id:
            return None
        
        # This could be enhanced to get location from user profile
        # For now, return None and require explicit location
        return None
    except Exception:
        return None


async def _fetch_weather_data(location: str, api_key: str) -> Dict[str, Any]:
    """Fetch weather data from OpenWeatherMap API."""
    config = get_config()
    base_url = config.weather.api_url
    
    # Determine if location is coordinates or city name
    if ',' in location and all(part.replace('.', '').replace('-', '').isdigit() for part in location.split(',')):
        # Coordinates format: "lat,lon"
        lat, lon = location.split(',')
        url = f"{base_url}/weather?lat={lat}&lon={lon}&appid={api_key}&units={config.weather.default_units}"
    else:
        # City name
        url = f"{base_url}/weather?q={location}&appid={api_key}&units={config.weather.default_units}"
    
    timeout = aiohttp.ClientTimeout(total=config.weather.request_timeout)
    
    for attempt in range(config.weather.max_retries + 1):
        try:
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data
                    elif response.status == 401:
                        raise WeatherAPIError("Invalid API key")
                    elif response.status == 404:
                        raise WeatherAPIError(f"Location '{location}' not found")
                    else:
                        raise WeatherAPIError(f"API request failed with status {response.status}")
        except asyncio.TimeoutError:
            if attempt < config.weather.max_retries:
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
                continue
            raise WeatherAPIError("Request timeout")
        except aiohttp.ClientError as e:
            if attempt < config.weather.max_retries:
                await asyncio.sleep(2 ** attempt)
                continue
            raise WeatherAPIError(f"Network error: {str(e)}")
    
    raise WeatherAPIError("Max retries exceeded")


async def _format_weather_for_running(weather_data: Dict[str, Any], user_units: str) -> str:
    """Format weather data with running-specific advice."""
    try:
        # Extract key weather information
        temp = weather_data['main']['temp']
        feels_like = weather_data['main']['feels_like']
        humidity = weather_data['main']['humidity']
        wind_speed = weather_data['wind']['speed']
        wind_dir = weather_data['wind'].get('deg', 0)
        description = weather_data['weather'][0]['description']
        city = weather_data['name']
        country = weather_data['sys']['country']
        
        # Convert temperature if needed
        if user_units == "imperial":
            temp = (temp * 9/5) + 32
            feels_like = (feels_like * 9/5) + 32
            temp_unit = "°F"
            wind_speed = wind_speed * 2.237  # m/s to mph
            wind_unit = "mph"
        else:
            temp_unit = "°C"
            wind_speed = wind_speed * 3.6  # m/s to km/h
            wind_unit = "km/h"
        
        # Wind direction
        wind_directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
        wind_dir_text = wind_directions[int((wind_dir + 11.25) / 22.5) % 16]
        
        # Running-specific advice
        advice = []
        
        # Temperature advice
        if user_units == "imperial":
            if temp < 32:
                advice.append("❄️ Freezing conditions - wear layers and watch for ice")
            elif temp < 50:
                advice.append("🧥 Cool weather - perfect for running, dress in layers")
            elif temp < 65:
                advice.append("👕 Ideal running temperature - light layers recommended")
            elif temp < 75:
                advice.append("☀️ Great running weather - stay hydrated")
            elif temp < 85:
                advice.append("🌡️ Warm conditions - run early/late, increase hydration")
            else:
                advice.append("🔥 Hot weather - avoid midday runs, prioritize safety")
        else:
            if temp < 0:
                advice.append("❄️ Below freezing - wear layers and watch for ice")
            elif temp < 10:
                advice.append("🧥 Cool weather - perfect for running, dress in layers")
            elif temp < 18:
                advice.append("👕 Ideal running temperature - light layers recommended")
            elif temp < 24:
                advice.append("☀️ Great running weather - stay hydrated")
            elif temp < 29:
                advice.append("🌡️ Warm conditions - run early/late, increase hydration")
            else:
                advice.append("🔥 Hot weather - avoid midday runs, prioritize safety")
        
        # Humidity advice
        if humidity > 80:
            advice.append("💧 High humidity - expect slower paces and increased sweat")
        elif humidity > 60:
            advice.append("💨 Moderate humidity - good conditions for running")
        
        # Wind advice
        if wind_speed > 25:
            advice.append(f"💨 Strong winds from {wind_dir_text} - adjust pace and route")
        elif wind_speed > 15:
            advice.append(f"🌪️ Moderate winds from {wind_dir_text} - consider wind direction")
        
        # Weather condition advice
        if 'rain' in description.lower():
            advice.append("🌧️ Rainy conditions - wear appropriate gear and watch footing")
        elif 'snow' in description.lower():
            advice.append("❄️ Snow conditions - consider traction aids and visibility")
        elif 'thunderstorm' in description.lower():
            advice.append("⛈️ Thunderstorms - postpone outdoor running for safety")
        elif 'fog' in description.lower():
            advice.append("🌫️ Foggy conditions - wear bright colors and be extra cautious")
        
        # Format the response
        response = f"""🌤️ Current Weather for {city}, {country}:
        
🌡️ Temperature: {temp:.1f}{temp_unit} (feels like {feels_like:.1f}{temp_unit})
💧 Humidity: {humidity}%
💨 Wind: {wind_speed:.1f} {wind_unit} from {wind_dir_text}
☁️ Conditions: {description.title()}

🏃 Running Recommendations:
""" + "\n".join(f"• {rec}" for rec in advice)
        
        return response
        
    except Exception as e:
        logger.error(f"Error formatting weather data: {e}")
        return f"Weather data available but formatting failed: {str(e)}"


@handle_database_errors
async def get_current_weather_tool(location: str = None) -> str:
    """Get current weather conditions for running planning.
    
    Args:
        location: Location name (city, state/country) or coordinates (lat,lon).
                 If not provided, uses user's default location if available.
    
    Returns:
        Formatted weather information with running-specific advice.
    """
    try:
        # Get API key
        api_key = await _get_weather_api_key()
        if not api_key:
            return "❌ Weather service not configured. Please set WEATHER__API_KEY environment variable."
        
        # Determine location
        if not location:
            location = await _get_user_location()
            if not location:
                return "📍 Please provide a location (city name or coordinates) to get weather information."
        
        # Check cache
        cache_key = f"weather:{location}"
        cached_data = await _get_cached_weather(cache_key)
        
        if cached_data:
            # Use cached data
            user_units = get_user_distance_unit() or "metric"
            # Convert from miles/kilometers to metric/imperial for weather API
            if user_units == "miles":
                user_units = "imperial"
            else:
                user_units = "metric"
            return await _format_weather_for_running(cached_data, user_units)
        
        # Fetch fresh data
        weather_data = await _fetch_weather_data(location, api_key)
        
        # Cache the data
        await _cache_weather_data(cache_key, weather_data)
        
        # Format for user
        user_units = get_user_distance_unit() or "metric"
        # Convert from miles/kilometers to metric/imperial for weather API
        if user_units == "miles":
            user_units = "imperial"
        else:
            user_units = "metric"
        return await _format_weather_for_running(weather_data, user_units)
        
    except WeatherAPIError as e:
        logger.error(f"Weather API error: {e}")
        return f"❌ Weather service error: {str(e)}"
    except Exception as e:
        logger.error(f"Unexpected error in get_current_weather_tool: {e}")
        return f"❌ Unable to retrieve weather information: {str(e)}"


@handle_database_errors
async def get_weather_forecast_tool(location: str = None, days: int = 5) -> str:
    """Get weather forecast for running planning.
    
    Args:
        location: Location name (city, state/country) or coordinates (lat,lon).
                 If not provided, uses user's default location if available.
        days: Number of days to forecast (1-5).
    
    Returns:
        Formatted weather forecast with running recommendations.
    """
    try:
        # Validate days parameter
        if days < 1 or days > 5:
            return "❌ Forecast days must be between 1 and 5."
        
        # Get API key
        api_key = await _get_weather_api_key()
        if not api_key:
            return "❌ Weather service not configured. Please set WEATHER__API_KEY environment variable."
        
        # Determine location
        if not location:
            location = await _get_user_location()
            if not location:
                return "📍 Please provide a location (city name or coordinates) to get weather forecast."
        
        # Check cache
        cache_key = f"forecast:{location}:{days}"
        cached_data = await _get_cached_weather(cache_key)
        
        if cached_data:
            return cached_data.get('formatted_response', "Cached forecast data available")
        
        # Fetch forecast data
        config = get_config()
        base_url = config.weather.api_url
        
        if ',' in location and all(part.replace('.', '').replace('-', '').isdigit() for part in location.split(',')):
            lat, lon = location.split(',')
            url = f"{base_url}/forecast?lat={lat}&lon={lon}&appid={api_key}&units={config.weather.default_units}&cnt={days * 8}"
        else:
            url = f"{base_url}/forecast?q={location}&appid={api_key}&units={config.weather.default_units}&cnt={days * 8}"
        
        timeout = aiohttp.ClientTimeout(total=config.weather.request_timeout)
        
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(url) as response:
                if response.status == 200:
                    forecast_data = await response.json()
                else:
                    return f"❌ Weather forecast request failed with status {response.status}"
        
        # Format forecast
        user_units = get_user_distance_unit() or "metric"
        # Convert from miles/kilometers to metric/imperial for weather API
        if user_units == "miles":
            user_units = "imperial"
        else:
            user_units = "metric"
        formatted_response = await _format_forecast_for_running(forecast_data, user_units, days)
        
        # Cache the formatted response
        await _cache_weather_data(cache_key, {"formatted_response": formatted_response})
        
        return formatted_response
        
    except Exception as e:
        logger.error(f"Error in get_weather_forecast_tool: {e}")
        return f"❌ Unable to retrieve weather forecast: {str(e)}"


async def _format_forecast_for_running(forecast_data: Dict[str, Any], user_units: str, days: int) -> str:
    """Format forecast data with running-specific advice."""
    try:
        city = forecast_data['city']['name']
        country = forecast_data['city']['country']
        forecasts = forecast_data['list']
        
        # Group forecasts by day
        daily_forecasts = {}
        for forecast in forecasts:
            date = datetime.fromtimestamp(forecast['dt']).date()
            if date not in daily_forecasts:
                daily_forecasts[date] = []
            daily_forecasts[date].append(forecast)
        
        # Format response
        response = f"🌤️ {days}-Day Weather Forecast for {city}, {country}:\n\n"
        
        for i, (date, day_forecasts) in enumerate(list(daily_forecasts.items())[:days]):
            # Get morning and evening forecasts
            morning_forecast = day_forecasts[0] if day_forecasts else None
            evening_forecast = day_forecasts[-1] if len(day_forecasts) > 1 else morning_forecast
            
            if morning_forecast:
                temp_min = morning_forecast['main']['temp_min']
                temp_max = morning_forecast['main']['temp_max']
                description = morning_forecast['weather'][0]['description']
                
                # Convert temperatures if needed
                if user_units == "imperial":
                    temp_min = (temp_min * 9/5) + 32
                    temp_max = (temp_max * 9/5) + 32
                    temp_unit = "°F"
                else:
                    temp_unit = "°C"
                
                # Running recommendation
                if temp_max < 0 or temp_max > 35:  # Extreme temperatures
                    run_advice = "🚨 Extreme weather - consider indoor training"
                elif 'rain' in description.lower() or 'storm' in description.lower():
                    run_advice = "🌧️ Wet conditions - indoor or covered routes recommended"
                elif temp_min < 5 or temp_max > 28:
                    run_advice = "⚠️ Challenging conditions - adjust timing and gear"
                else:
                    run_advice = "✅ Good conditions for outdoor running"
                
                response += f"📅 {date.strftime('%A, %B %d')}:\n"
                response += f"   🌡️ {temp_min:.1f}-{temp_max:.1f}{temp_unit} | {description.title()}\n"
                response += f"   🏃 {run_advice}\n\n"
        
        return response
        
    except Exception as e:
        logger.error(f"Error formatting forecast data: {e}")
        return f"Forecast data available but formatting failed: {str(e)}"


@handle_database_errors
async def analyze_weather_impact_tool(location: str = None) -> str:
    """Analyze weather impact on running performance and provide recommendations.
    
    Args:
        location: Location name (city, state/country) or coordinates (lat,lon).
                 If not provided, uses user's default location if available.
    
    Returns:
        Detailed analysis of weather impact on running performance.
    """
    try:
        # Get current weather
        weather_response = await get_current_weather_tool(location)
        if weather_response.startswith("❌"):
            return weather_response
        
        # Get API key for additional analysis
        api_key = await _get_weather_api_key()
        if not api_key:
            return "❌ Weather service not configured for detailed analysis."
        
        # Determine location
        if not location:
            location = await _get_user_location()
            if not location:
                return "📍 Please provide a location for weather impact analysis."
        
        # Get detailed weather data
        weather_data = await _fetch_weather_data(location, api_key)
        
        # Analyze impact
        temp = weather_data['main']['temp']
        humidity = weather_data['main']['humidity']
        wind_speed = weather_data['wind']['speed'] * 3.6  # Convert to km/h
        
        analysis = ["🔍 Weather Impact Analysis for Running:\n"]
        
        # Temperature impact
        if temp < 0:
            analysis.append("❄️ Cold Impact: Increased calorie burn, longer warmup needed, risk of muscle stiffness")
        elif temp > 25:
            analysis.append("🔥 Heat Impact: Increased heart rate, higher sweat rate, elevated perceived exertion")
        else:
            analysis.append("🌡️ Temperature Impact: Optimal conditions for performance")
        
        # Humidity impact
        if humidity > 70:
            analysis.append("💧 High Humidity: Reduced sweat evaporation, expect 10-15% slower pace")
        elif humidity < 30:
            analysis.append("🏜️ Low Humidity: Increased dehydration risk, more frequent water breaks needed")
        else:
            analysis.append("💨 Humidity Impact: Good conditions for heat regulation")
        
        # Wind impact
        if wind_speed > 20:
            analysis.append("💨 Strong Wind: Headwind adds 10-20 seconds per mile, plan route accordingly")
        elif wind_speed > 10:
            analysis.append("🌪️ Moderate Wind: Minor impact on pace, consider wind direction for route")
        else:
            analysis.append("🍃 Wind Impact: Minimal effect on performance")
        
        # Recommendations
        analysis.append("\n🎯 Performance Recommendations:")
        analysis.append("• Adjust target pace based on conditions")
        analysis.append("• Modify hydration strategy")
        analysis.append("• Consider route changes for wind/elevation")
        analysis.append("• Plan appropriate clothing layers")
        
        return "\n".join(analysis)
        
    except Exception as e:
        logger.error(f"Error in analyze_weather_impact_tool: {e}")
        return f"❌ Unable to analyze weather impact: {str(e)}"