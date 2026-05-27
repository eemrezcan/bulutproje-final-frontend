import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CloudSun, RadioTower, Thermometer, Wind } from "lucide-react";
import { getHealth, getLatestReadings, getSensors } from "../api/iot";
import { ErrorState, LoadingState } from "../components/DataState";
import { MetricCard } from "../components/MetricCard";
import { SensorMap } from "../components/SensorMap";
import { ConnectionBadge, StatusBadge } from "../components/StatusBadge";
import type { RiskLevel, SensorReading } from "../types";

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

  const sensors = sensorsQuery.data ?? [];
  const latestReadings = latestQuery.data ?? [];
  const activeSensors = sensors.filter((sensor) => sensor.status === "active").length;
  const avgTemperature = average(latestReadings.map((reading) => reading.temperature));
  const avgAirQuality = average(latestReadings.map((reading) => reading.air_quality_index));
  const riskyZones = latestReadings.filter((reading) => reading.status_level !== "normal").length;
  const cityRisk = riskScore(latestReadings);
  const cityRiskLevel: RiskLevel = cityRisk >= 4 ? "critical" : cityRisk >= 2 ? "warning" : "normal";

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
          <ConnectionBadge active={healthQuery.data?.mqtt_connected ?? false} label="MQTT" />
          <ConnectionBadge active={healthQuery.data?.simulator_running ?? false} label="Simulator" />
        </div>
      </div>

      {isInitialLoading ? <LoadingState /> : null}
      {hasError ? <ErrorState /> : null}

      {!isInitialLoading && !hasError ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
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
            <div className="border-b border-slate-200 p-4">
              <h2 className="text-base font-semibold text-slate-950">Son IoT olcumleri</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
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
