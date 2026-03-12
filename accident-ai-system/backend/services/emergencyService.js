const axios = require('axios');

/**
 * Find nearest emergency services (hospital, police) using OpenStreetMap Overpass API
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} radius - Search radius in meters (default 5000)
 */
const findNearestServices = async (lat, lon, radius = 5000) => {
  try {
    // Overpass QL to find nearest hospital and police station
    // [out:json];(node["amenity"="hospital"](around:5000,lat,lon);node["amenity"="police"](around:5000,lat,lon););out body;
    const overpassQuery = `
      [out:json];
      (
        node["amenity"="hospital"](around:${radius},${lat},${lon});
        node["amenity"="police"](around:${radius},${lat},${lon});
      );
      out body;
    `;
    
    const response = await axios.post('https://overpass-api.de/api/interpreter', overpassQuery, {
      headers: { 'Content-Type': 'text/plain' }
    });

    const elements = response.data.elements;
    
    const hospitals = elements.filter(e => e.tags && e.tags.amenity === 'hospital');
    const police = elements.filter(e => e.tags && e.tags.amenity === 'police');

    // Simple nearest selection (just picking the first output for mock purposes)
    const nearestHospital = hospitals.length > 0 ? {
      name: hospitals[0].tags.name || 'Unknown Hospital',
      lat: hospitals[0].lat,
      lon: hospitals[0].lon,
    } : null;

    const nearestPolice = police.length > 0 ? {
      name: police[0].tags.name || 'Unknown Police Station',
      lat: police[0].lat,
      lon: police[0].lon,
    } : null;

    return { nearestHospital, nearestPolice };
  } catch (error) {
    console.error('Error fetching from Overpass API:', error.message);
    return { nearestHospital: null, nearestPolice: null };
  }
};

module.exports = {
  findNearestServices
};
