<script setup>
import { onMounted, ref, watch } from 'vue';
import L from 'leaflet';

const props = defineProps({
  initialLat: {
    type: Number,
    required: true
  },
  initialLng: {
    type: Number,
    required: true
  }
});

const emit = defineEmits(['update-location']);

const mapContainer = ref(null);
let map = null;

onMounted(() => {
  if (mapContainer.value) {
    map = L.map(mapContainer.value, {
        zoomControl: false,
        attributionControl: false
    }).setView([props.initialLat, props.initialLng], 10);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    map.on('moveend', () => {
      const center = map.getCenter();
      emit('update-location', { lat: center.lat, lng: center.lng });
    });
  }
});

// Watch for external updates to center the map (e.g. initial geolocation)
watch(() => [props.initialLat, props.initialLng], ([newLat, newLng]) => {
    if (map) {
        const currentCenter = map.getCenter();
        // Only update view if the new position is significantly different (external update)
        // This prevents the map from resetting zoom/pan when the update comes from the map itself
        if (Math.abs(currentCenter.lat - newLat) > 0.0001 || Math.abs(currentCenter.lng - newLng) > 0.0001) {
            map.setView([newLat, newLng], map.getZoom());
        }
    }
});

</script>

<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<style scoped>
.map-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}
</style>
