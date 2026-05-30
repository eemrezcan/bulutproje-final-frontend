import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BrainCircuit, CloudSun, RadioTower, Thermometer, TrendingUp, Video, Wind } from "lucide-react";
import { getHealth, getLatestReadings, getSensors } from "../api/iot";
import { getLatestPredictions, getMlHealth, getModelStatus } from "../api/ml";
import { getCameras, getLatestAnalysis, getVideoHealth } from "../api/video";
import { ErrorState, LoadingState } from "../components/DataState";
import { MetricCard } from "../components/MetricCard";
import { SensorMap } from "../components/SensorMap";
import { ConnectionBadge, StatusBadge } from "../components/StatusBadge";
import type { CrowdLevel, Prediction, RiskLevel, SensorReading } from "../types";

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(value));
}

function riskScore(readings: SensorReading[]) {
  const weights: Record<RiskLevel, number> = { normal: 0, warning: 1, critical: 2 };
  return readings.reduce((total, reading) => total + weights[reading.status_level], 0);
}

function crowdTone(level?: CrowdLevel) {
  if (level === "critical") {
    return "text-red-700";
  }
  if (level === "high") {
    return "text-amber-700";
  }
  return "text-slate-600";
}

function mlRiskTone(level?: RiskLevel): "green" | "amber" | "red" {
  if (level === "critical") {
    return "red";
  }
  if (level === "warning") {
    return "amber";
  }
  return "green";
}

function latestMlByZone(predictions: Prediction[]) {
  const seen = new Set<string>();
  return predictions.filter((prediction) => {
    if (seen.has(prediction.zone)) {
      return false;
    }
    seen.add(prediction.zone);
    return true;
  });
}

export function DashboardPage() {
  const sensorsQuery = useQuery({ queryKey: ["iot", "sensors"], queryFn: getSensors });
  const latestQuery = useQuery({
    queryKey: ["iot", "readings", "latest"],
    queryFn: getLatestReadings,
    refetchInterval: 5000
  });
  const healthQuery = useQuery({
    queryKey: ["iot", "health"],
    queryFn: getHealth,
    refetchInterval: 10000
  });
  const videoHealthQuery = useQuery({
    queryKey: ["video", "health"],
    queryFn: getVideoHealth,
    refetchInterval: 10000
  });
  const camerasQuery = useQuery({ queryKey: ["video", "cameras"], queryFn: getCameras });
  const videoLatestQuery = useQuery({
    queryKey: ["video", "analysis", "latest"],
    queryFn: getLatestAnalysis,
    refetchInterval: 3000
  });
  const mlHealthQuery = useQuery({
    queryKey: ["ml", "health"],
    queryFn: getMlHealth,
    refetchInterval: 30000
  });
  const mlModelQuery = useQuery({
    queryKey: ["ml", "model", "status"],
    queryFn: getModelStatus,
    refetchInterval: 30000
  });
  const mlLatestQuery = useQuery({
    queryKey: ["ml", "predictions", "latest"],
    queryFn: getLatestPredictions,
    refetchInterval: 10000
  });

  const sensors = sensorsQuery.data ?? [];
  const latestReadings = latestQuery.data ?? [];
  const cameras = camerasQuery.data ?? [];
  const videoLatest = videoLatestQuery.data ?? [];
  const mlLatest = latestMlByZone(mlLatestQuery.data ?? []);
  const activeSensors = sensors.filter((sensor) => sensor.status === "active").length;
  const activeCameras = cameras.filter((camera) => camera.status === "active").length;
  const highCrowdCameras = videoLatest.filter(
    (event) => event.crowd_level === "high" || event.crowd_level === "critical"
  ).length;
  const avgTemperature = average(latestReadings.map((reading) => reading.temperature));
  const avgAirQuality = average(latestReadings.map((reading) => reading.air_quality_index));
  const riskyZones = latestReadings.filter((reading) => reading.status_level !== "normal").length;
  const cityRisk = riskScore(latestReadings);
  const cityRiskLevel: RiskLevel = cityRisk >= 4 ? "critical" : cityRisk >= 2 ? "warning" : "normal";
  const avgMlRisk = average(mlLatest.map((prediction) => prediction.risk_score));
  const mlCriticalCount = mlLatest.filter((prediction) => prediction.risk_level === "critical").length;
  const mlWarningCount = mlLatest.filter((prediction) => prediction.risk_level === "warning").length;
  const riskiestMlZone = [...mlLatest].sort((first, second) => second.risk_score - first.risk_score)[0];

  const isInitialLoading = sensorsQuery.isLoading || latestQuery.isLoading;
  const hasError = sensorsQuery.isError || latestQuery.isError;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-950">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Sehir geneli IoT operasyon ozeti</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ConnectionBadge active={healthQuery.data?.status === "ok"} label="IoT API" />
          <ConnectionBadge active={videoHealthQuery.data?.status === "ok"} label="Video API" />
          <ConnectionBadge active={mlHealthQuery.data?.status === "ok"} label="ML API" />
          <ConnectionBadge active={healthQuery.data?.mqtt_connected ?? false} label="MQTT" />
          <ConnectionBadge active={healthQuery.data?.simulator_running ?? false} label="Simulator" />
        </div>
      </div>

      {isInitialLoading ? <LoadingState /> : null}
      {hasError ? <ErrorState /> : null}

      {!isInitialLoading && !hasError ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <MetricCard
              title="Aktif sensor"
              value={`${activeSensors}/${sensors.length}`}
              detail="IoT Service /sensors"
              icon={RadioTower}
              tone="green"
            />
            <MetricCard
              title="Ortalama sicaklik"
              value={`${avgTemperature.toFixed(1)} C`}
              detail="Son olcumlere gore"
              icon={Thermometer}
              tone="red"
            />
            <MetricCard
              title="Ortalama hava kalitesi"
              value={Math.round(avgAirQuality)}
              detail="AQI ortalamasi"
              icon={Wind}
              tone="blue"
            />
            <MetricCard
              title="Riskli bolge"
              value={riskyZones}
              detail="Warning veya critical"
              icon={AlertTriangle}
              tone={riskyZones > 0 ? "amber" : "green"}
            />
            <MetricCard
              title="Aktif kamera"
              value={`${activeCameras}/${cameras.length}`}
              detail={`${highCrowdCameras} kamera high/critical`}
              icon={Video}
              tone={highCrowdCameras > 0 ? "amber" : "green"}
            />
            <MetricCard
              title="ML risk skoru"
              value={Math.round(avgMlRisk)}
              detail={riskiestMlZone ? `En riskli: ${riskiestMlZone.zone}` : "Tahmin bekleniyor"}
              icon={TrendingUp}
              tone={mlRiskTone(riskiestMlZone?.risk_level)}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-950">Sehir haritasi</h2>
                  <p className="text-sm text-slate-500">Sensor noktalari ve anlik risk seviyesi</p>
                </div>
                <StatusBadge level={cityRiskLevel} />
              </div>
              <SensorMap sensors={sensors} latestReadings={latestReadings} />
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-950">Sehir durumu</h2>
                  <p className="text-sm text-slate-500">Basit risk siniflandirmasi</p>
                </div>
                <CloudSun className="h-5 w-5 text-sky-600" aria-hidden="true" />
              </div>
              <div className="space-y-3">
                {latestReadings.map((reading) => (
                  <div key={reading.sensor_id} className="rounded-md border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-slate-950">{reading.zone}</p>
                      <StatusBadge level={reading.status_level} />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-500">
                      <span>{reading.temperature.toFixed(1)} C</span>
                      <span>AQI {reading.air_quality_index}</span>
                      <span>Trafik {reading.traffic_level}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4">
              <div>
                <h2 className="text-base font-semibold text-slate-950">ML risk ozeti</h2>
                <p className="text-sm text-slate-500">Son tahminlerden karar destek gorunumu</p>
              </div>
              <ConnectionBadge active={mlModelQuery.data?.model_ready ?? false} label="Model" />
            </div>
            {mlLatestQuery.isError || mlModelQuery.isError ? (
              <div className="p-4">
                <ErrorState message="ML ozeti alinamadi." />
              </div>
            ) : (
              <div className="grid gap-3 p-4 lg:grid-cols-[minmax(240px,0.55fr)_minmax(0,1.45fr)]">
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                  <div className="rounded-md border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">Sehir genel risk</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-950">{Math.round(avgMlRisk)}</p>
                  </div>
                  <div className="rounded-md border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">Critical / warning</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-950">
                      {mlCriticalCount}/{mlWarningCount}
                    </p>
                  </div>
                  <div className="rounded-md border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">En riskli bolge</p>
                    <p className="mt-1 truncate text-2xl font-semibold text-slate-950">{riskiestMlZone?.zone ?? "-"}</p>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {mlLatest.slice(0, 4).map((prediction) => (
                    <div key={prediction.zone} className="rounded-md border border-slate-200 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-slate-950">{prediction.zone}</p>
                        <StatusBadge level={prediction.risk_level} />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                        <span>Risk {prediction.risk_score}</span>
                        <span>{prediction.predicted_temperature.toFixed(1)} C</span>
                      </div>
                      <p className="mt-2 truncate text-xs text-slate-500">{prediction.recommendation}</p>
                    </div>
                  ))}
                  {!mlLatestQuery.isLoading && mlLatest.length === 0 ? (
                    <p className="text-sm text-slate-500">ML tahmini bekleniyor.</p>
                  ) : null}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4">
              <div>
                <h2 className="text-base font-semibold text-slate-950">Video ozeti</h2>
                <p className="text-sm text-slate-500">Son video analizlerinden operasyon listesi</p>
              </div>
              <ConnectionBadge active={videoHealthQuery.data?.analyzer_running ?? false} label="Analyzer" />
            </div>
            {videoLatestQuery.isError || camerasQuery.isError ? (
              <div className="p-4">
                <ErrorState message="Video ozeti alinamadi." />
              </div>
            ) : (
              <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-5">
                {videoLatest.slice(0, 5).map((event) => (
                  <div key={event.camera_id} className="rounded-md border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-slate-950">{event.zone}</p>
                      <span className={`shrink-0 text-xs font-semibold capitalize ${crowdTone(event.crowd_level)}`}>
                        {event.crowd_level}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                      <span>Kisi {event.people_count}</span>
                      <span>Arac {event.vehicle_count}</span>
                    </div>
                    <p className="mt-2 truncate text-xs text-slate-500">{event.recognition_labels.join(", ")}</p>
                  </div>
                ))}
                {!videoLatestQuery.isLoading && videoLatest.length === 0 ? (
                  <p className="text-sm text-slate-500">Video analizi bekleniyor.</p>
                ) : null}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4">
              <h2 className="text-base font-semibold text-slate-950">Son IoT olcumleri</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Bolge</th>
                    <th className="px-4 py-3">Sicaklik</th>
                    <th className="px-4 py-3">Nem</th>
                    <th className="px-4 py-3">AQI</th>
                    <th className="px-4 py-3">Trafik</th>
                    <th className="px-4 py-3">Durum</th>
                    <th className="px-4 py-3">Saat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {latestReadings.map((reading) => (
                    <tr key={reading.sensor_id}>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-950">{reading.zone}</td>
                      <td className="whitespace-nowrap px-4 py-3">{reading.temperature.toFixed(1)} C</td>
                      <td className="whitespace-nowrap px-4 py-3">%{reading.humidity}</td>
                      <td className="whitespace-nowrap px-4 py-3">{reading.air_quality_index}</td>
                      <td className="whitespace-nowrap px-4 py-3">{reading.traffic_level}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusBadge level={reading.status_level} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDateTime(reading.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
