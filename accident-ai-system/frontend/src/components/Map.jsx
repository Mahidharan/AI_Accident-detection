import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

// Fix Leaflet's default icon issue with React
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

function Map({ accidents, userLocation }) {
  // Default center (e.g., center of US or a specific city)
  const defaultCenter = [39.8283, -98.5795];
  const center = userLocation
    ? [userLocation.latitude, userLocation.longitude]
    : accidents.length > 0
      ? [accidents[0].location.latitude, accidents[0].location.longitude]
      : defaultCenter;
  const zoom = accidents.length > 0 || userLocation ? 12 : 4;

  const redIcon = new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const blueIcon = new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
    >
      {/* OpenStreetMap Dark Theme Tiles (CartoDB Dark Matter) */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />

      {/* User's live location */}
      {userLocation && (
        <Marker
          position={[userLocation.latitude, userLocation.longitude]}
          icon={blueIcon}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-bold text-blue-600">Your Location</h3>
              <p>
                {userLocation.latitude.toFixed(4)},{" "}
                {userLocation.longitude.toFixed(4)}
              </p>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Accident markers */}
      {accidents.map((accident) => (
        <Marker
          key={accident._id}
          position={[accident.location.latitude, accident.location.longitude]}
          icon={redIcon}
        >
          <Popup className="bg-slate-800 text-white rounded">
            <div className="p-2 space-y-1">
              <h3 className="font-bold text-red-500 border-b border-slate-600 pb-1">
                Accident Alert
              </h3>
              <p>
                <span className="text-slate-400">Vehicle:</span>{" "}
                {accident.vehicleNumber}
              </p>
              <p>
                <span className="text-slate-400">Airbag:</span>{" "}
                {accident.airbagDeployed ? "Deployed" : "N/A"}
              </p>
              <p>
                <span className="text-slate-400">Time:</span>{" "}
                {new Date(accident.timestamp).toLocaleTimeString()}
              </p>
              <p>
                <span className="text-slate-400">Coords:</span>{" "}
                {accident.location.latitude.toFixed(4)},{" "}
                {accident.location.longitude.toFixed(4)}
              </p>
              {accident.smsSentTo && accident.smsSentTo.length > 0 && (
                <p>
                  <span className="text-slate-400">SMS sent to:</span>{" "}
                  {accident.smsSentTo.join(", ")}
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default Map;
