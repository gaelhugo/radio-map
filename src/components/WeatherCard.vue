<script setup>
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { getWeatherDescription, getWeatherIcon, getWindDirection } from '../services/WeatherService';
import { getStationsByCountry, getStationsByState, getNearestStation } from '../services/RadioService';

const props = defineProps({
  current: {
    type: Object,
    required: true
  },
  daily: {
    type: Object,
    required: true
  },
  locationName: {
      type: String,
      default: 'Your Location'
  },
  timezone: {
      type: String,
      required: true
  },
  timezoneAbbreviation: {
      type: String,
      required: true
  },
  countryCode: {
      type: String,
      default: ''
  },
  state: {
      type: String,
      default: ''
  },
  lat: {
      type: Number,
      required: true
  },
  lng: {
      type: Number,
      required: true
  }
});



const currentTemp = computed(() => Math.round(props.current.temperature_2m));
const weatherCode = computed(() => props.current.weather_code);
const description = computed(() => getWeatherDescription(weatherCode.value));
const icon = computed(() => getWeatherIcon(weatherCode.value));
const minTemp = computed(() => Math.round(props.daily.temperature_2m_min[0]));
const maxTemp = computed(() => Math.round(props.daily.temperature_2m_max[0]));
const windDirText = computed(() => getWindDirection(props.current.wind_direction_10m));

// Radio Player
const currentStation = ref(null);
const isPlaying = ref(false);
const audioPlayer = ref(null);
const radioLoading = ref(false);

const fetchAndPlayRadio = async () => {
    if (!props.countryCode) return;
    
    radioLoading.value = true;
    try {
        let stations = [];
        // Try fetching by state first if available
        if (props.state) {
            stations = await getStationsByState(props.countryCode, props.state);
        }
        
        // Fallback to country if no state stations found
        if (stations.length === 0) {
            stations = await getStationsByCountry(props.countryCode);
        }

        const nearest = getNearestStation(stations, props.lat, props.lng);
        
        if (nearest) {
            // Only update if it's a different station
            if (!currentStation.value || currentStation.value.stationuuid !== nearest.stationuuid) {
                currentStation.value = nearest;
                nextTick(() => {
                    if (audioPlayer.value) {
                        audioPlayer.value.src = nearest.url_resolved || nearest.url;
                        audioPlayer.value.play().then(() => {
                            isPlaying.value = true;
                        }).catch(e => {
                            console.warn("Autoplay prevented:", e);
                            isPlaying.value = false;
                        });
                    }
                });
            }
        } else {
            console.log("No local station found");
        }
    } catch (e) {
        console.error("Radio error:", e);
    } finally {
        radioLoading.value = false;
    }
};

const togglePlay = () => {
    if (!audioPlayer.value) return;
    if (isPlaying.value) {
        audioPlayer.value.pause();
        isPlaying.value = false;
    } else {
        audioPlayer.value.play();
        isPlaying.value = true;
    }
};

watch(() => [props.lat, props.lng, props.countryCode], () => {
    console.log("Radio props changed");
    fetchAndPlayRadio();
}, { immediate: true });

// ... (rest of script)

const localTime = computed(() => {
    try {
        return new Date().toLocaleTimeString('en-US', {
            timeZone: props.timezone,
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    } catch (e) {
        return '';
    }
});

// Particle System
const windCanvas = ref(null);
let animationId = null;
let resizeObserver = null;

const initParticles = async () => {
    await nextTick();
    const canvas = windCanvas.value;
    if (!canvas) return;
    
    // Ensure we have dimensions
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    if (width === 0 || height === 0) {
        // Retry shortly if dimensions are not ready
        setTimeout(initParticles, 100);
        return;
    }

    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    
    const particles = [];
    const particleCount = 30;
    
    // Convert wind direction (degrees) to radians.
    // Wind direction is "coming from".
    // 0° = North (blowing South). Canvas 0 is Right.
    // We want particles to move South (Down). Down is 90° in canvas math.
    // So 0° -> 90°.
    // 90° (East) -> Blowing West (Left). Left is 180°.
    // Formula: angle = windDir - 90 + 180 = windDir + 90.
    const windDir = props.current.wind_direction_10m || 0;
    const angleRad = (windDir + 90) * (Math.PI / 180);
    
    // Scale speed more linearly with actual wind speed
    // 10 km/h -> ~1 px/frame?
    const windSpeed = props.current.wind_speed_10m || 0;
    const speedBase = windSpeed * 0.15; 
    
    const vx = Math.cos(angleRad) * speedBase;
    const vy = Math.sin(angleRad) * speedBase;

    class Particle {
        constructor() {
            this.reset();
            this.x = Math.random() * width;
            this.y = Math.random() * height;
        }
        
        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.life = Math.random() * 100 + 50;
            this.opacity = 0;
            // Less random speed variation to keep flow consistent
            this.speedMult = 0.8 + Math.random() * 0.4; 
        }
        
        update() {
            // Remove random jitter to show clear direction
            this.x += vx * this.speedMult;
            this.y += vy * this.speedMult;
            this.life--;
            
            if (this.life > 130) this.opacity += 0.01;
            else if (this.life < 30) this.opacity -= 0.01;
            else this.opacity = 0.6;
            
            if (this.x < -20 || this.x > width + 20 || this.y < -20 || this.y > height + 20 || this.life <= 0) {
                this.reset();
            }
        }
        
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, 0.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, this.opacity)})`;
            ctx.fill();
        }
    }
    
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
    
    const animate = () => {
        // Create trails by fading out existing content
        ctx.globalCompositeOperation = 'destination-out';
        // Lower opacity = longer trails. Higher speed needs longer trails?
        // Actually fixed opacity is fine, but let's make it slightly lower for smoother lines
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)'; 
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'source-over';

        particles.forEach(p => {
            p.update();
            p.draw();
        });
        animationId = requestAnimationFrame(animate);
    };
    
    animate();
};

onMounted(() => {
    initParticles();
    
    // Handle resize
    if (windCanvas.value) {
        resizeObserver = new ResizeObserver(() => {
            if (animationId) cancelAnimationFrame(animationId);
            initParticles();
        });
        resizeObserver.observe(windCanvas.value);
    }
});

onUnmounted(() => {
    if (animationId) cancelAnimationFrame(animationId);
    if (resizeObserver) resizeObserver.disconnect();
});

watch(() => props.current.wind_direction_10m, () => {
    if (animationId) cancelAnimationFrame(animationId);
    initParticles();
});

</script>

<template>
  <div class="weather-card">
    <div class="location">{{ locationName }}</div>
    <div class="time-info">
        <span class="time">{{ localTime }}</span>
        <span class="timezone">{{ timezoneAbbreviation }}</span>
    </div>
    <div class="main-info">
        <div class="icon">{{ icon }}</div>
        <div class="temperature">{{ currentTemp }}°C</div>
    </div>
    <div class="condition">{{ description }}</div>
    <div class="details">
        <div class="detail-item">
            <span class="label">H:</span>
            <span class="value">{{ maxTemp }}°</span>
        </div>
        <div class="detail-item">
            <span class="label">L:</span>
            <span class="value">{{ minTemp }}°</span>
        </div>
        <div class="detail-item wind-item">
            <canvas ref="windCanvas" class="wind-canvas"></canvas>
            <span class="label">Wind:</span>
            <span class="value">{{ current.wind_speed_10m }} km/h <span v-if="windDirText" class="wind-dir">{{ windDirText }}</span></span>
        </div>
    </div>
    
    <div v-if="currentStation" class="radio-player">
        <div class="radio-info">
            <span class="radio-label">LIVE RADIO</span>
            <span class="station-name">{{ currentStation.name }}</span>
        </div>
        <button class="play-btn" @click="togglePlay">
            {{ isPlaying ? '⏸' : '▶' }}
        </button>
        <audio ref="audioPlayer" class="hidden-audio"></audio>
    </div>
  </div>
</template>

<style scoped>
.weather-card {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.85) 0%, rgba(118, 75, 162, 0.85) 100%);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem;
  color: white;
  text-align: center;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  border: 1px solid rgba(255, 255, 255, 0.18);
  max-width: 350px;
  width: 100%;
  margin: 0 auto;
  transition: transform 0.3s ease;
}

.weather-card:hover {
    transform: translateY(-5px);
}

.location {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.time-info {
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
    opacity: 0.9;
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    align-items: center;
}

.time {
    font-weight: 600;
    font-size: 1.1rem;
}

.timezone {
    background: rgba(255, 255, 255, 0.2);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 700;
}

.main-info {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.5rem;
}

.icon {
    font-size: 4rem;
    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
}

.temperature {
    font-size: 4rem;
    font-weight: 700;
    text-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.condition {
    font-size: 1.2rem;
    margin-bottom: 1.5rem;
    opacity: 0.9;
    font-weight: 500;
}

.details {
    display: flex;
    justify-content: space-around;
    border-top: 1px solid rgba(255, 255, 255, 0.3);
    padding-top: 1rem;
}

.detail-item {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    position: relative; /* For canvas positioning */
}

.wind-item {
    overflow: hidden; /* Contain particles */
    padding: 0 5px;
    border-radius: 8px;
}

.wind-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    opacity: 0.6;
}

.label {
    font-size: 0.8rem;
    opacity: 0.8;
    text-transform: uppercase;
    letter-spacing: 1px;
    z-index: 1; /* Above canvas */
}

.value {
    font-weight: 600;
    font-size: 1.1rem;
    z-index: 1; /* Above canvas */
}

.wind-dir {
    font-size: 0.8rem;
    opacity: 0.8;
    margin-left: 4px;
}

.radio-player {
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.3);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.radio-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
    overflow: hidden;
}

.radio-label {
    font-size: 0.7rem;
    font-weight: 700;
    color: #ff6b6b; /* Accent color */
    letter-spacing: 1px;
    margin-bottom: 2px;
}

.station-name {
    font-size: 0.9rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
}

.play-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.2s;
}

.play-btn:hover {
    background: rgba(255, 255, 255, 0.4);
}

.hidden-audio {
    display: none;
}
</style>
