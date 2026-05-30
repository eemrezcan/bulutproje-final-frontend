import { mlApi } from "./client";
import type { CityZone, MlHealthResponse, ModelStatus, ModelTrainResponse, Prediction, ZoneRisk } from "../types";

export async function getMlHealth() {
  const response = await mlApi.get<MlHealthResponse>("/health");
  return response.data;
}

export async function getModelStatus() {
  const response = await mlApi.get<Omit<ModelStatus, "model_ready"> & { model_ready?: boolean }>("/model/status");
  return {
    ...response.data,
    model_ready: response.data.model_ready ?? response.data.trained
  };
}

export async function trainModel() {
  const response = await mlApi.post<ModelTrainResponse>("/model/train");
  return response.data;
}

export async function generatePredictions() {
  const response = await mlApi.post<Prediction[]>("/predictions/generate");
  return response.data;
}

export async function getLatestPredictions() {
  const response = await mlApi.get<Prediction[]>("/predictions/latest");
  return response.data;
}

export async function getZonePredictions(zone: CityZone, limit = 50) {
  const response = await mlApi.get<Prediction[]>("/predictions", {
    params: { zone, limit }
  });
  return response.data;
}

export async function getZoneRisk(zone: CityZone) {
  const response = await mlApi.get<ZoneRisk>(`/zones/${encodeURIComponent(zone)}/risk`);
  return response.data;
}
