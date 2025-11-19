const BASE_URL = 'https://de1.api.radio-browser.info/json/stations';

export const getStationsByCountry = async (countryCode) => {
    try {
        const response = await fetch(`${BASE_URL}/search?countrycode=${countryCode}&hidebroken=true&has_geo_info=true&limit=100&order=clickcount&reverse=true`);
        if (!response.ok) throw new Error('Failed to fetch stations');
        return await response.json();
    } catch (error) {
        console.error("Radio API Error:", error);
        return [];
    }
};

export const getStationsByState = async (countryCode, state) => {
    try {
        // Search by state and country. State names can be tricky, so we might need fuzzy search or just try exact match.
        // The API supports 'state' parameter.
        const response = await fetch(`${BASE_URL}/search?countrycode=${countryCode}&state=${encodeURIComponent(state)}&hidebroken=true&has_geo_info=true&limit=100&order=clickcount&reverse=true`);
        if (!response.ok) throw new Error('Failed to fetch stations by state');
        return await response.json();
    } catch (error) {
        console.error("Radio API Error (State):", error);
        return [];
    }
};

export const getNearestStation = (stations, lat, lon) => {
    if (!stations || stations.length === 0) return null;

    let nearest = null;
    let minDistance = Infinity;

    stations.forEach(station => {
        if (station.geo_lat && station.geo_long) {
            const dist = getDistanceFromLatLonInKm(lat, lon, station.geo_lat, station.geo_long);
            if (dist < minDistance) {
                minDistance = dist;
                nearest = station;
            }
        }
    });

    return nearest;
};

// Haversine formula
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
