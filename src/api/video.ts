import { videoApi } from "./client";
import type { AnalyzerCommandState, AnalyzerHealth, Camera, CityZone, StreamInfo, VideoAnalysisEvent } from "../types";

export async function getVideoHealth() {
  const response = await videoApi.get<AnalyzerHealth>("/health");
  return response.data;
}

export async function getCameras() {
  const response = await videoApi.get<Camera[]>("/cameras");
  return response.data;
}

export async function getCamera(cameraId: string) {
  const response = await videoApi.get<Camera>(`/cameras/${encodeURIComponent(cameraId)}`);
  return response.data;
}

export async function getCameraStream(cameraId: string) {
  const response = await videoApi.get<StreamInfo>(`/cameras/${encodeURIComponent(cameraId)}/stream`);
  return response.data;
}

export async function getLatestAnalysis() {
  const response = await videoApi.get<VideoAnalysisEvent[]>("/analysis/latest");
  return response.data;
}

export async function getCameraAnalysis(cameraId: string, limit = 50) {
  const response = await videoApi.get<VideoAnalysisEvent[]>("/analysis", {
    params: { camera_id: cameraId, limit }
  });
  return response.data;
}

export async function getZoneAnalysis(zone: CityZone, limit = 50) {
  const response = await videoApi.get<VideoAnalysisEvent[]>(`/zones/${encodeURIComponent(zone)}/analysis`, {
    params: { limit }
  });
  return response.data;
}

export async function generateAnalysis() {
  const response = await videoApi.post<VideoAnalysisEvent[]>("/analysis/generate");
  return response.data;
}

export async function startAnalyzer() {
  const response = await videoApi.post<AnalyzerCommandState>("/analyzer/start");
  return response.data;
}

export async function stopAnalyzer() {
  const response = await videoApi.post<AnalyzerCommandState>("/analyzer/stop");
  return response.data;
}
