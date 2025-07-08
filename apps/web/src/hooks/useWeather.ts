import { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from './useUser';

export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  location?: string;
}

export function useWeather() {
  const { profile } = useUser();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchWeather() {
      if (!profile?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let latitude: number, longitude: number, location: string;
        let locationSource: 'current' | 'saved' = 'current';

        // First try to get current location via geolocation
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            if (!navigator.geolocation) {
              reject(new Error('Geolocation not supported'));
              return;
            }
            
            navigator.geolocation.getCurrentPosition(
              resolve,
              reject,
              { timeout: 8000, enableHighAccuracy: true, maximumAge: 300000 } // 5 min cache
            );
          });

          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
          location = `${latitude},${longitude}`;
          locationSource = 'current';
        } catch (geoError) {
          console.log('Geolocation failed, trying saved location:', geoError);
          
          // Fallback to saved location from user profile
          if (profile.latitude && profile.longitude) {
            latitude = profile.latitude;
            longitude = profile.longitude;
            location = `${latitude},${longitude}`;
            locationSource = 'saved';
            console.log('Using saved location:', location);
          } else {
            throw new Error('No location available - geolocation failed and no saved location');
          }
        }

        // Call our API endpoint that uses MCP on the server side
        const response = await axios.post('/api/weather', {
          location,
          userId: profile.id,
          latitude,
          longitude,
          locationSource
        });

        if (!response.data) {
          throw new Error('Failed to fetch weather data');
        }

        const weatherData = parseWeatherData(response.data);
        
        if (mounted) {
          setWeather(weatherData);
        }
      } catch (err) {
        console.error('Weather fetch error:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch weather');
          // Fallback to generic weather data
          setWeather({
            temperature: 68,
            condition: 'Partly Cloudy',
            humidity: 45,
            windSpeed: 5,
            location: profile?.city ? `${profile.city}${profile.state ? ', ' + profile.state : ''}` : 'Your Location'
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchWeather();

    return () => {
      mounted = false;
    };
  }, [profile?.id]);

  return { weather, loading, error };
}

function parseWeatherData(weatherData: any): WeatherData {
  // Handle direct API response format
  if (typeof weatherData === 'object') {
    return {
      temperature: Math.round(weatherData.temperature || weatherData.temp || 68),
      condition: weatherData.condition || weatherData.description || 'Clear',
      humidity: Math.round(weatherData.humidity || 45),
      windSpeed: Math.round(weatherData.windSpeed || weatherData.wind_speed || 5),
      location: weatherData.location || weatherData.name
    };
  }
  
  // Handle string response format
  try {
    const parsed = JSON.parse(weatherData);
    return {
      temperature: Math.round(parsed.temperature || parsed.temp || 68),
      condition: parsed.condition || parsed.description || 'Clear',
      humidity: Math.round(parsed.humidity || 45),
      windSpeed: Math.round(parsed.windSpeed || parsed.wind_speed || 5),
      location: parsed.location || parsed.name
    };
  } catch {
    // Fallback parsing from text
    const tempMatch = weatherData.match(/(\d+)°?[CF]?/);
    const temperature = tempMatch ? parseInt(tempMatch[1]) : 68;
    
    let condition = 'Clear';
    if (weatherData.toLowerCase().includes('rain')) condition = 'Rainy';
    else if (weatherData.toLowerCase().includes('cloud')) condition = 'Cloudy';
    else if (weatherData.toLowerCase().includes('sun')) condition = 'Sunny';
    
    return {
      temperature,
      condition,
      humidity: 45,
      windSpeed: 5
    };
  }
}