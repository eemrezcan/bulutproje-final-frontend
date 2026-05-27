import axios from "axios";

export const iotApi = axios.create({
  baseURL: import.meta.env.VITE_IOT_API_URL ?? "http://localhost:8001"
});

export const videoApi = axios.create({
  baseURL: import.meta.env.VITE_VIDEO_API_URL ?? "http://localhost:8002"
});

export const mlApi = axios.create({
  baseURL: import.meta.env.VITE_ML_API_URL ?? "http://localhost:8003"
});

