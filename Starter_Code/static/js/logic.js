// Helper functions to define marker size and color based on earthquake data
// This function adjusts the marker size based on the magnitude of the earthquake
const getMarkerSize = (magnitude) => magnitude > 0 ? magnitude ** 7 : 1;

// This function assigns a color to the marker based on the earthquake's depth
const getColorByDepth = (depth) => {
  if (depth <= 10) return "#98EE00";     // Shallow earthquakes: green
  if (depth <= 30) return "#D4EE00";     // Shallow earthquakes: yellow-green
  if (depth <= 50) return "#EECC00";     // Moderate depth: yellow
  if (depth <= 70) return "#EE9C00";     // Deeper earthquakes: orange
  if (depth <= 90) return "#EA822C";     // Deep earthquakes: orange-red
  return "#EA2C2C";                      // Very deep earthquakes: red
};

// Main function to create and render the map with earthquake data and tectonic plates
const createMap = (earthquakeData, geoJsonData) => {
  // Step 1: Set up the base map layers
  // Street map layer (OpenStreetMap)
  const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  });

  // Topographic map layer (OpenTopoMap)
  const topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
      '<a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> ' +
      '(<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
  });

  // Step 2: Prepare layers for markers, heatmap, and circle markers
  const markerCluster = L.markerClusterGroup();  // To cluster markers for better visualization
  const heatPoints = [];  // For heatmap data points
  const circleMarkers = [];  // For circle markers to display magnitude and depth

  // Loop through earthquake data and process each entry
  earthquakeData.forEach(item => {
    const { geometry, properties } = item;  // Destructure the geometry and properties for easier access
    if (geometry) {
      const coordinates = [geometry.coordinates[1], geometry.coordinates[0]];  // Convert long/lat to lat/lon
      const magnitude = properties.mag;  // Earthquake magnitude
      const depth = geometry.coordinates[2];  // Earthquake depth

      // Create a simple marker with a popup for each earthquake
      const marker = L.marker(coordinates).bindPopup(`<h1>${properties.title}</h1>`);
      markerCluster.addLayer(marker);  // Add marker to the cluster group

      // Add the point to the heatmap array
      heatPoints.push(coordinates);

      // Create a circle marker to visually represent earthquake magnitude and depth
      const circle = L.circle(coordinates, {
        fillOpacity: 0.75,
        color: getColorByDepth(depth),  // Color based on depth
        fillColor: getColorByDepth(depth),  // Same color for fill
        radius: getMarkerSize(magnitude)  // Size based on magnitude
      }).bindPopup(`<h1>${properties.title}</h1>`);  // Add a popup to the circle
      circleMarkers.push(circle);  // Add the circle marker to the array
    }
  });

  // Heatmap layer based on earthquake coordinates
  const heatLayer = L.heatLayer(heatPoints, {
    radius: 25,  // Radius of heatmap points
    blur: 20     // Blur intensity
  });

  // GeoJSON layer for tectonic plates
  const geoLayer = L.geoJSON(geoJsonData, {
    style: { color: "firebrick", weight: 5 }  // Style the tectonic plate boundaries
  });

  // Step 3: Setup Layer Control for toggling between different map layers
  const baseLayers = {
    "Street View": streetLayer,  // Base street map layer
    "Topography": topoLayer      // Base topographic map layer
  };

  const overlayLayers = {
    "Earthquake Markers": markerCluster,  // Cluster of earthquake markers
    "Heatmap": heatLayer,  // Heatmap of earthquake points
    "Circles": L.layerGroup(circleMarkers),  // Circle markers
    "Tectonic Plates": geoLayer  // Tectonic plate boundaries
  };

  // Step 4: Initialize the map
  const map = L.map("map", {
    center: [40.7, -94.5],  // Map's center coordinates
    zoom: 3,  // Initial zoom level
    layers: [streetLayer, markerCluster, geoLayer]  // Default layers on the map
  });

  // Step 5: Add layer control to the map (switch between base and overlay layers)
  L.control.layers(baseLayers, overlayLayers).addTo(map);

  // Step 6: Add a legend to the map to explain the depth color coding
  const legend = L.control({ position: "bottomright" });
  legend.onAdd = () => {
    const div = L.DomUtil.create("div", "info legend");
    const depthRange = [
      { color: "#98EE00", range: "-10 to 10" },
      { color: "#D4EE00", range: "10 to 30" },
      { color: "#EECC00", range: "30 to 50" },
      { color: "#EE9C00", range: "50 to 70" },
      { color: "#EA822C", range: "70 to 90" },
      { color: "#EA2C2C", range: "90+" }
    ];

    let legendInfo = "<h4>Depth Legend</h4>";
    depthRange.forEach(item => {
      legendInfo += `<i style='background: ${item.color}'></i>${item.range}<br/>`;
    });

    div.innerHTML = legendInfo;  // Inject legend info into the div
    return div;
  };
  legend.addTo(map);  // Add the legend to the map
};

// Function to fetch and process earthquake and tectonic data
const fetchData = () => {
  const earthquakeUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";
  const tectonicUrl = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";

  d3.json(earthquakeUrl).then((earthquakeResponse) => {
    d3.json(tectonicUrl).then((tectonicResponse) => {
      const earthquakeData = earthquakeResponse.features;  // Get the earthquake features
      createMap(earthquakeData, tectonicResponse);  // Create the map with earthquake data and tectonic plates
    });
  });
};

// Start the process by calling the fetchData function
fetchData();