<script setup>
import { ref, onMounted } from 'vue';
import { getCurrentLocation } from './services/LocationService';
import { getWeather, getLocationName } from './services/WeatherService';
import WeatherCard from './components/WeatherCard.vue';
import MapBackground from './components/MapBackground.vue';

const weatherInfo = ref(null);
const loading = ref(true);
const error = ref(null);
const currentLat = ref(0);
const currentLng = ref(0);
const locationInitialized = ref(false);
const locationName = ref('Your Location');
const countryCode = ref('');
const state = ref('');

const fetchWeather = async (lat, lng) => {
    loading.value = true;
    error.value = null;
    try {
        // Artificial delay for smoother UX
        // await new Promise(r => setTimeout(r, 500)); 
        const [weather, location] = await Promise.all([
            getWeather(lat, lng),
            getLocationName(lat, lng)
        ]);
        weatherInfo.value = weather;
        locationName.value = location.name;
        countryCode.value = location.countryCode;
        state.value = location.state;
    } catch (e) {
        console.error(e);
        error.value = "Unable to retrieve weather data.";
    } finally {
        loading.value = false;
    }
};

const initializeLocation = async () => {
    try {
        const location = await getCurrentLocation();
        currentLat.value = location.latitude;
        currentLng.value = location.longitude;
        locationInitialized.value = true;
        await fetchWeather(location.latitude, location.longitude);
    } catch (e) {
        console.error(e);
        // Default to London if permission denied
        currentLat.value = 51.505;
        currentLng.value = -0.09;
        locationInitialized.value = true;
        if (e.code === 1) {
            error.value = "Location access denied. Defaulting to London.";
        } else {
            error.value = "Unable to find you. Defaulting to London.";
        }
        await fetchWeather(currentLat.value, currentLng.value);
    }
};

const onLocationUpdate = async ({ lat, lng }) => {
    // Update coordinates to trigger reactive updates in child components
    currentLat.value = lat;
    currentLng.value = lng;
    // Fetch new weather
    await fetchWeather(lat, lng);
};

onMounted(() => {
    initializeLocation();
});
</script>

<template>
  <div class="app-container">
    <MapBackground 
        v-if="locationInitialized"
        :initial-lat="currentLat" 
        :initial-lng="currentLng" 
        @update-location="onLocationUpdate"
    />
    
    <div class="crosshair"></div>

    <div class="content-overlay">
        <div v-if="loading && !weatherInfo" class="loading">
            <div class="spinner"></div>
            <p>Loading...</p>
        </div>
        <div v-else-if="error && !weatherInfo" class="error">
            <div class="error-icon">📍</div>
            <p>{{ error }}</p>
            <button @click="initializeLocation">Try Again</button>
        </div>
        <WeatherCard 
            v-else-if="weatherInfo" 
            :current="weatherInfo.current"
            :daily="weatherInfo.daily"
            :location-name="locationName"
            :timezone="weatherInfo.timezone"
            :timezone-abbreviation="weatherInfo.timezone_abbreviation"
            :country-code="countryCode"
            :state="state"
            :lat="currentLat"
            :lng="currentLng"
        />
    </div>
  </div>
</template>

<style>
:root {
  font-family: 'Inter', system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.95);
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
  background: #2c3e50; /* Fallback color */
  overflow: hidden; /* Prevent scrolling */
}

#app {
    width: 100%;
    height: 100vh;
}

.app-container {
    width: 100%;
    height: 100%;
    position: relative;
}

.crosshair {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 20px;
    height: 20px;
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 5000; /* Extremely high to ensure visibility */
    mix-blend-mode: difference; /* Invert colors to be visible on any background */
}

.crosshair::before, .crosshair::after {
    content: '';
    position: absolute;
    background: white;
    box-shadow: 0 0 2px rgba(0,0,0,0.5);
}

.crosshair::before {
    top: 9px;
    left: 0;
    width: 20px;
    height: 2px;
}

.crosshair::after {
    top: 0;
    left: 9px;
    width: 2px;
    height: 20px;
}

.content-overlay {
    position: absolute;
    top: 2rem;
    right: 2rem;
    width: 25rem;

    z-index: 6000; /* Above crosshair */
    pointer-events: none; /* Allow clicking through to map */
}

.content-overlay > * {
    pointer-events: auto; /* Re-enable clicks on the card itself */
}

.loading, .error {
    text-align: center;
    color: white;
    font-size: 1.2rem;
    background: rgba(0, 0, 0, 0.6);
    padding: 2rem;
    border-radius: 16px;
    backdrop-filter: blur(5px);
    max-width: 300px;
}

.error-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.spinner {
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top: 4px solid white;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

button {
    margin-top: 1rem;
    padding: 0.8rem 1.5rem;
    border-radius: 8px;
    border: none;
    background: white;
    color: #764ba2;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0,0,0,0.15);
}

button:active {
    transform: scale(0.95);
}

@media (max-width: 768px) {
    .content-overlay {
        top: auto;
        bottom: 1.5rem;
        left: 0;
        right: 0;
        margin: 0 auto;
        transform: none;
        width: 92%;
        max-width: 400px;
    }

    .crosshair {
        /* Move crosshair up significantly to avoid overlap with the card */
        top: 30%; 
    }
}
</style>
