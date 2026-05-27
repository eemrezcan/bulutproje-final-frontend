import { iotApi } from "./client";
import type { CityZone, HealthResponse, Sensor, SensorReading, SimulatorState } from "../types";

export async function getHealth() {
  const response = await iotApi.get<HealthResponse>("/health");
  return response.data;
}

export async function getSensors() {
  const response = await iotApi.get<Sensor[]>("/sensors");
  return response.data;
}

export async function getLatestReadings() {
  const response = await iotApi.get<SensorReading[]>("/readings/latest");
  return response.data;
}

export async function getSensorReadings(sensorId: string, limit = 50) {
  const response = await iotApi.get<SensorReading[]>("/readings", {
    params: { sensor_id: sensorId, limit }
  });
  return response.data;
}

export async function getZoneReadings(zone: CityZone, limit = 50) {
  const response = await iotApi.get<SensorReading[]>(`/zones/${encodeURIComponent(zone)}/readings`, {
    params: { limit }
  });
  return response.data;
}

export async function startSimulator() {
  const response = await iotApi.post<SimulatorState>("/simulator/start");
  return response.data;
}

export async function stopSimulator() {
  const response = await iotApi.post<SimulatorState>("/simulator/stop");
  return response.data;
}
