# Radio Map

A dynamic, immersive weather application that combines real-time weather data with local radio stations from around the world. Explore the globe, check the weather, and listen to the local vibe.

## 🌟 Features

- **Interactive World Map**: Drag and explore any location on Earth using Leaflet.js.
- **Real-time Weather**: Instant weather updates including temperature, condition, min/max temps, and wind speed (powered by Open-Meteo).
- **Local Radio Player**: Automatically finds and plays a local radio station based on your map location. It prioritizes stations in the specific state/region before falling back to the country.
- **Wind Particle Animation**: A beautiful, canvas-based particle system that visualizes wind speed and direction in real-time.
- **Smart Geolocation**:
  - Visual crosshair alignment (offset for mobile devices to ensure visibility).
  - Reverse geocoding to display Location Name, State, and Country.
- **Responsive Design**: Fully optimized for mobile devices (including small screens like iPhone SE) with a bottom-sheet style layout and touch-friendly controls.
- **Glassmorphism UI**: Modern, sleek interface with dynamic gradients and blur effects.

## 🛠️ Tech Stack

- **Frontend Framework**: Vue 3 (Composition API)
- **Build Tool**: Vite
- **Map Library**: Leaflet
- **Styling**: Vanilla CSS3 (Variables, Flexbox, Grid, Glassmorphism)
- **APIs**:
  - [Open-Meteo](https://open-meteo.com/) (Weather)
  - [OpenStreetMap Nominatim](https://nominatim.org/) (Reverse Geocoding)
  - [Radio Browser](https://www.radio-browser.info/) (Radio Stations)

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+)
- npm

### Installation

1.  Clone the repository:

    ```bash
    git clone <repository-url>
    cd radio-map
    ```

2.  Install dependencies:

    ```bash
    npm install
    ```

3.  Run the development server:
    ```bash
    npm run dev
    ```

## ☁️ Deployment (GitHub Pages)

This project is configured for automated deployment to GitHub Pages using GitHub Actions.

1.  **Push to main**:
    Any push to the `main` branch will trigger the deployment workflow.

2.  **Workflow**:
    The `.github/workflows/jekyll-gh-pages.yml` workflow handles:
    - Installing dependencies (`npm ci`)
    - Building the project (`npm run build`)
    - Uploading the artifact
    - Deploying to GitHub Pages

Ensure your repository settings are configured to deploy from **GitHub Actions** (Settings > Pages > Source).

## 📂 Project Structure

- `src/components/`:
  - `MapBackground.vue`: Handles the Leaflet map, visual centering logic, and coordinate updates.
  - `WeatherCard.vue`: Displays weather info, wind animation, and the radio player.
- `src/services/`:
  - `WeatherService.js`: Fetches weather data and location names.
  - `RadioService.js`: Fetches radio stations and calculates the nearest one.
  - `LocationService.js`: Handles browser geolocation.
- `src/App.vue`: Main application logic, state management, and layout.

## 📱 Mobile Optimization

The app features specific logic for mobile devices:

- **Visual Center Offset**: On screens narrower than 768px, the "center" of the map (the crosshair) is shifted to the top 30% of the screen to accommodate the weather card at the bottom.
- **Compact UI**: The weather card adapts its layout, font sizes, and padding to fit comfortably on small screens.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
