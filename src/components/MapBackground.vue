<script setup>
import { onMounted, onUnmounted, ref, watch } from "vue";
import L from "leaflet";

const props = defineProps({
  initialLat: {
    type: Number,
    required: true,
  },
  initialLng: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(["update-location"]);

const mapContainer = ref(null);
let map = null;

onMounted(() => {
  if (mapContainer.value) {
    map = L.map(mapContainer.value, {
      zoomControl: false,
      attributionControl: false,
    }).setView([props.initialLat, props.initialLng], 10);

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      },
    ).addTo(map);

    // Immediately adjust view to align with the visual crosshair (which might be offset on mobile)
    setVisualView(props.initialLat, props.initialLng);

    map.on("moveend", () => {
      const center = getVisualCenter();
      emit("update-location", { lat: center.lat, lng: center.lng });
    });
  }
});

const getVisualCenter = () => {
  if (!map) return { lat: 0, lng: 0 };
  const size = map.getSize();
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  // On mobile, crosshair is at 30% height. On desktop, 50%.
  const crosshairY = isMobile ? size.y * 0.3 : size.y * 0.5;
  return map.containerPointToLatLng([size.x / 2, crosshairY]);
};

const setVisualView = (lat, lng) => {
  if (!map) return;
  const zoom = map.getZoom();
  const size = map.getSize();
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const crosshairY = isMobile ? size.y * 0.3 : size.y * 0.5;
  const centerOffset = size.y * 0.5 - crosshairY;

  // We want (lat, lng) to be at crosshairY.
  // Map center is at size.y * 0.5.
  // So Map Center should be (lat, lng) shifted DOWN by centerOffset.
  const targetPoint = map.project([lat, lng], zoom);
  const newCenterPoint = targetPoint.add([0, centerOffset]);
  const newCenter = map.unproject(newCenterPoint, zoom);

  map.setView(newCenter, zoom);
};

// Handle window resize to keep the location centered under the crosshair
const onResize = () => {
  if (map) {
    map.invalidateSize();
    // Re-center the map on the current location (props)
    setVisualView(props.initialLat, props.initialLng);
  }
};

onMounted(() => {
  window.addEventListener("resize", onResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", onResize);
});

// Watch for external updates to center the map (e.g. initial geolocation)
watch(
  () => [props.initialLat, props.initialLng],
  ([newLat, newLng]) => {
    if (map) {
      const currentVisualCenter = getVisualCenter();
      // Only update view if the new position is significantly different (external update)
      // We use a slightly larger threshold to avoid floating point jitter
      if (
        Math.abs(currentVisualCenter.lat - newLat) > 0.0005 ||
        Math.abs(currentVisualCenter.lng - newLng) > 0.0005
      ) {
        setVisualView(newLat, newLng);
      }
    }
  },
);
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
