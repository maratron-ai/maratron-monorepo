import { NextRequest, NextResponse } from 'next/server';
import { getMCPClient } from '@lib/mcp/client';
import { withErrorHandler } from '@lib/utils/errorHandling';
import { prisma } from '@lib/prisma';

export const POST = withErrorHandler(async (request: NextRequest) => {
  try {
    const { location, userId, latitude, longitude, locationSource } = await request.json();

    if (!location) {
      return NextResponse.json(
        { error: 'Location is required' },
        { status: 400 }
      );
    }

    // If we have user location data, save it to the database
    if (userId && latitude && longitude && locationSource === 'current') {
      try {
        // Get location details using reverse geocoding
        const locationDetails = await reverseGeocode(latitude, longitude);
        
        // Update user's location in database
        await prisma.user.update({
          where: { id: userId },
          data: {
            latitude: latitude,
            longitude: longitude,
            city: locationDetails.city,
            state: locationDetails.state,
            country: locationDetails.country,
            locationUpdatedAt: new Date()
          }
        });

        console.log(`Updated location for user ${userId}: ${locationDetails.city}, ${locationDetails.state}`);
      } catch (locationUpdateError) {
        console.warn('Failed to update user location:', locationUpdateError);
        // Continue with weather fetch even if location update fails
      }
    }

    // Try to use MCP client to get weather (server-side only)
    try {
      const mcpClient = getMCPClient();
      await mcpClient.connect();
      
      const result = await mcpClient.callTool({
        name: 'get_current_weather',
        arguments: { location }
      });

      if (!result.isError && result.content[0]?.text) {
        // Parse weather data from MCP response
        const weatherText = result.content[0].text;
        let weatherData;
        
        try {
          weatherData = JSON.parse(weatherText);
          
          // Enhance location display if we have coordinates
          if (latitude && longitude && !weatherData.location) {
            const locationDetails = await reverseGeocode(latitude, longitude);
            weatherData.location = `${locationDetails.city}, ${locationDetails.state}`;
          }
        } catch {
          // Fallback parsing
          const tempMatch = weatherText.match(/(\d+)°?[CF]?/);
          const temperature = tempMatch ? parseInt(tempMatch[1]) : 68;
          
          let condition = 'Clear';
          if (weatherText.toLowerCase().includes('rain')) condition = 'Rainy';
          else if (weatherText.toLowerCase().includes('cloud')) condition = 'Cloudy';
          else if (weatherText.toLowerCase().includes('sun')) condition = 'Sunny';
          
          // Get location name for display
          let locationName = 'Current Location';
          if (latitude && longitude) {
            try {
              const locationDetails = await reverseGeocode(latitude, longitude);
              locationName = `${locationDetails.city}, ${locationDetails.state}`;
            } catch {
              locationName = 'Your Location';
            }
          }
          
          weatherData = {
            temperature,
            condition,
            humidity: 45,
            windSpeed: 5,
            location: locationName
          };
        }

        return NextResponse.json(weatherData);
      }
    } catch (mcpError) {
      console.warn('MCP weather request failed, using fallback:', mcpError);
    }

    // Return fallback weather data when MCP fails
    let fallbackLocation = 'Current Location';
    if (latitude && longitude) {
      try {
        const locationDetails = await reverseGeocode(latitude, longitude);
        fallbackLocation = `${locationDetails.city}, ${locationDetails.state}`;
      } catch {
        fallbackLocation = 'Your Location';
      }
    }

    return NextResponse.json({
      temperature: 68,
      condition: 'Partly Cloudy',
      humidity: 45,
      windSpeed: 5,
      location: fallbackLocation
    });
  } catch (error) {
    console.error('Weather API error:', error);
    
    // Return fallback weather data on error
    return NextResponse.json({
      temperature: 68,
      condition: 'Partly Cloudy',
      humidity: 45,
      windSpeed: 5,
      location: 'Current Location'
    });
  }
});

// Reverse geocoding function to get location details from coordinates
async function reverseGeocode(latitude: number, longitude: number): Promise<{
  city: string;
  state: string;
  country: string;
}> {
  try {
    // Using OpenStreetMap Nominatim API for reverse geocoding (free, no API key needed)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Maratron-Weather-App/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }

    const data = await response.json();
    const address = data.address || {};

    return {
      city: address.city || address.town || address.village || address.hamlet || 'Unknown City',
      state: address.state || address.province || address.region || '',
      country: address.country || 'Unknown Country'
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return {
      city: 'Unknown City',
      state: '',
      country: 'Unknown Country'
    };
  }
}