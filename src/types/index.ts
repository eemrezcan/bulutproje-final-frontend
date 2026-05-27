export type RiskLevel = "normal" | "warning" | "critical";

export type CityZone = "Meydan" | "Otogar" | "Kampus" | "Hastane" | "Sanayi";

export type SensorStatus = "active" | "passive" | "maintenance" | string;

export interface Sensor {
  sensor_id: string;
  zone: CityZone;
  name: string;
  status: SensorStatus;
  latitude: number;
  longitude: number;
}

export interface SensorReading {
  sensor_id: string;
  zone: CityZone;
  temperature: number;
  humidity: number;
  air_quality_index: number;
  traffic_level: number;
  timestamp: string;
  status_level: RiskLevel;
}

export interface HealthResponse {
  service: string;
  status: string;
  mqtt_connected: boolean;
  simulator_running: boolean;
}

export interface SimulatorState {
  running: boolean;
}
