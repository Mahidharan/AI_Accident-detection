import axios from "axios";

const API_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// User login with email
export const loginUser = (email, password) =>
  api.post("/auth/login", { email, password });

// User registration
export const registerUser = (formData) => api.post("/auth/register", formData);

// Fetch all accidents for a vehicle
export const getAccidents = (vehicleNumber) =>
  api.get("/accident", { params: vehicleNumber ? { vehicleNumber } : {} });

// Fetch dashboard stats (real-time) for a vehicle
export const getDashboardStats = (vehicleNumber) =>
  api.get("/accident/stats", {
    params: vehicleNumber ? { vehicleNumber } : {},
  });

// Fetch live activity stream for a vehicle
export const getLiveActivity = (vehicleNumber) =>
  api.get("/accident/activity", {
    params: vehicleNumber ? { vehicleNumber } : {},
  });

// Get nearby emergency services
export const getNearbyServices = (lat, lon) =>
  api.get(`/emergency/nearby?lat=${lat}&lon=${lon}`);

// Update user's GPS location
export const updateUserLocation = (vehicleNumber, latitude, longitude) =>
  api.post("/auth/update-location", { vehicleNumber, latitude, longitude });

// Get user by vehicle number
export const getUserByVehicle = (vehicleNumber) =>
  api.get(`/auth/user/${encodeURIComponent(vehicleNumber)}`);

export default api;
