export type RiskLevel = "normal" | "warning" | "critical";

export type CityZone = "Meydan" | "Otogar" | "Kampus" | "Hastane" | "Sanayi";

export type SensorStatus = "active" | "passive" | "maintenance" | string;

export type CrowdLevel = "low" | "medium" | "high" | "critical";

export type MotionLevel = "low" | "medium" | "high";

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

export interface Camera {
  camera_id: string;
  zone: CityZone;
  name: string;
  stream_url: string;
  status: SensorStatus;
  latitude: number;
  longitude: number;
}

export interface VideoAnalysisEvent {
  camera_id: string;
  zone: CityZone;
  people_count: number;
  vehicle_count: number;
  motion_level: MotionLevel;
  crowd_level: CrowdLevel;
  recognition_labels: string[];
  timestamp: string;
}

export interface StreamInfo {
  camera_id: string;
  zone: CityZone;
  stream_url: string;
  media_type: string;
  mode: string;
  playable: boolean;
  note: string | null;
}

export interface AnalyzerHealth {
  service: string;
  status: string;
  analyzer_running: boolean;
}

export interface AnalyzerCommandState {
  running: boolean;
  interval_seconds: number;
}

export interface MlHealthResponse {
  service: string;
  status: string;
  model_ready?: boolean;
}

export interface ModelStatus {
  trained: boolean;
  training_samples: number;
  trained_at: string | null;
  model_ready: boolean;
  model_path?: string;
}

export interface PredictionInputSummary {
  temperature: number;
  humidity: number;
  air_quality_index: number;
  traffic_level: number;
  people_count: number;
  vehicle_count: number;
  motion_level: MotionLevel;
  crowd_level: CrowdLevel;
}

export interface Prediction {
  zone: CityZone;
  prediction_timestamp: string;
  prediction_for: string;
  predicted_temperature: number;
  predicted_crowd_level: CrowdLevel;
  risk_score: number;
  risk_level: RiskLevel;
  recommendation: string;
  input_summary: PredictionInputSummary;
}

export interface ZoneRisk {
  zone: CityZone;
  risk_score: number;
  risk_level: RiskLevel;
  recommendation: string;
  prediction_for?: string;
  prediction_timestamp?: string;
}

export interface ModelTrainResponse {
  trained: boolean;
  training_samples: number;
  trained_at: string | null;
  model_ready: boolean;
}
