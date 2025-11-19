export const getWeather = async (lat, lon) => {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }
    return await response.json();
  } catch (error) {
    console.error("Weather API Error:", error);
    throw error;
  }
};

export const getLocationName = async (lat, lon) => {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        if (!response.ok) throw new Error('Failed to fetch location name');
        const data = await response.json();
        // Prioritize city, town, village, then generic address
        const name = data.address.city || data.address.town || data.address.village || data.address.hamlet || data.address.suburb || data.display_name.split(',')[0] || 'Unknown Location';
        const countryCode = data.address.country_code || '';
        const state = data.address.state || data.address.region || '';
        return { name, countryCode, state };
    } catch (error) {
        console.error("Geocoding Error:", error);
        return { name: "Unknown Location", countryCode: "", state: "" };
    }
};

export const getWeatherDescription = (code) => {
    const codes = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Fog',
        48: 'Depositing rime fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        56: 'Light freezing drizzle',
        57: 'Dense freezing drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        66: 'Light freezing rain',
        67: 'Heavy freezing rain',
        71: 'Slight snow fall',
        73: 'Moderate snow fall',
        75: 'Heavy snow fall',
        77: 'Snow grains',
        80: 'Slight rain showers',
        81: 'Moderate rain showers',
        82: 'Violent rain showers',
        85: 'Slight snow showers',
        86: 'Heavy snow showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with slight hail',
        99: 'Thunderstorm with heavy hail',
    }
    return codes[code] || 'Unknown';
}

export const getWeatherIcon = (code) => {
    // Simple mapping to emojis or class names
    if (code === 0) return '☀️';
    if (code >= 1 && code <= 3) return '⛅';
    if (code >= 45 && code <= 48) return '🌫️';
    if (code >= 51 && code <= 67) return '🌧️';
    if (code >= 71 && code <= 86) return '❄️';
    if (code >= 95) return '⛈️';
    return '❓';
}

export const getWindDirection = (degrees) => {
    if (degrees === undefined || degrees === null) return '';
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
}
