import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Droplets,
  type LucideIcon,
  Pause,
  Play,
  RadioTower,
  RefreshCw,
  Thermometer,
  TrafficCone,
  Wind
} from "lucide-react";
import {
  getHealth,
  getLatestReadings,
  getSensors,
  getZoneReadings,
  startSimulator,
  stopSimulator
} from "../api/iot";
import { ErrorState, LoadingState } from "../components/DataState";
import { ConnectionBadge, StatusBadge } from "../components/StatusBadge";
import type { CityZone, SensorReading } from "../types";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const zones: CityZone[] = ["Meydan", "Otogar", "Kampus", "Hastane", "Sanayi"];

function formatTime(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(value));
}

function ReadingValue({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </div>
      <p className="mt-1 truncate text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function SensorCard({
  sensorId,
  zone,
  reading
}: {
  sensorId: string;
  zone: CityZone;
  reading?: SensorReading;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-950">{zone}</p>
          <p className="mt-1 truncate text-xs text-slate-500">{sensorId}</p>
        </div>
        {reading ? <StatusBadge level={reading.status_level} /> : null}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <ReadingValue icon={Thermometer} label="Sicaklik" value={reading ? `${reading.temperature.toFixed(1)} C` : "-"} />
        <ReadingValue icon={Droplets} label="Nem" value={reading ? `%${reading.humidity}` : "-"} />
        <ReadingValue icon={Wind} label="Hava kalitesi" value={reading ? `AQI ${reading.air_quality_index}` : "-"} />
        <ReadingValue icon={TrafficCone} label="Trafik" value={reading ? `${reading.traffic_level}` : "-"} />
      </div>
      <p className="mt-3 text-xs text-slate-500">
        {reading ? `Son guncelleme: ${formatTime(reading.timestamp)}` : "Olcum bekleniyor"}
      </p>
    </article>
  );
}

export function IotPage() {
  const queryClient = useQueryClient();
  const [selectedZone, setSelectedZone] = useState<CityZone>("Meydan");

  const sensorsQuery = useQuery({ queryKey: ["iot", "sensors"], queryFn: getSensors });
  const latestQuery = useQuery({
    queryKey: ["iot", "readings", "latest"],
    queryFn: getLatestReadings,
    refetchInterval: 5000
  });
  const zoneQuery = useQuery({
    queryKey: ["iot", "zones", selectedZone, "readings"],
    queryFn: () => getZoneReadings(selectedZone, 50),
    refetchInterval: 5000
  });
  const healthQuery = useQuery({
    queryKey: ["iot", "health"],
    queryFn: getHealth,
    refetchInterval: 10000
  });

  const startMutation = useMutation({
    mutationFn: startSimulator,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["iot"] })
  });
  const stopMutation = useMutation({
    mutationFn: stopSimulator,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["iot"] })
  });

  const latestReadings = latestQuery.data ?? [];
  const readingsBySensor = useMemo(
    () => new Map(latestReadings.map((reading) => [reading.sensor_id, reading])),
    [latestReadings]
  );
  const sensors = sensorsQuery.data ?? [];

  const chartData = [...(zoneQuery.data ?? [])]
    .reverse()
    .map((reading) => ({
      time: formatTime(reading.timestamp),
      temperature: Number(reading.temperature.toFixed(1)),
      humidity: reading.humidity,
      airQuality: reading.air_quality_index,
      traffic: reading.traffic_level
    }));

  const isInitialLoading = sensorsQuery.isLoading || latestQuery.isLoading;
  const hasError = sensorsQuery.isError || latestQuery.isError;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-950">IoT</h1>
          <p className="mt-1 text-sm text-slate-500">Sensorler, son olcumler ve bolge zaman serisi</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ConnectionBadge active={healthQuery.data?.status === "ok"} label="IoT API" />
          <ConnectionBadge active={healthQuery.data?.simulator_running ?? false} label="Simulator" />
          <button
            type="button"
            onClick={() => startMutation.mutate()}
            disabled={startMutation.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            Baslat
          </button>
          <button
            type="button"
            onClick={() => stopMutation.mutate()}
            disabled={stopMutation.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Pause className="h-4 w-4" aria-hidden="true" />
            Durdur
          </button>
        </div>
      </div>

      {startMutation.isError || stopMutation.isError ? (
        <ErrorState message="Simulator komutu gonderilemedi. IoT API ve Docker servislerini kontrol edin." />
      ) : null}
      {isInitialLoading ? <LoadingState /> : null}
      {hasError ? <ErrorState /> : null}

      {!isInitialLoading && !hasError ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {sensors.map((sensor) => (
              <SensorCard
                key={sensor.sensor_id}
                sensorId={sensor.sensor_id}
                zone={sensor.zone}
                reading={readingsBySensor.get(sensor.sensor_id)}
              />
            ))}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-950">Bolge gecmisi</h2>
                <p className="text-sm text-slate-500">5 saniyede bir yenilenen son 50 olcum</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {zones.map((zone) => (
                  <button
                    type="button"
                    key={zone}
                    onClick={() => setSelectedZone(zone)}
                    className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                      selectedZone === zone
                        ? "border-sky-600 bg-sky-50 text-sky-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {zone}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4">
              {zoneQuery.isLoading ? (
                <LoadingState label="Bolge gecmisi yukleniyor" />
              ) : zoneQuery.isError ? (
                <ErrorState message="Bolge gecmisi alinamadi." />
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="time" tick={{ fontSize: 12 }} minTickGap={28} />
                      <YAxis tick={{ fontSize: 12 }} width={36} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="temperature" name="Sicaklik" stroke="#ef4444" dot={false} />
                      <Line type="monotone" dataKey="humidity" name="Nem" stroke="#0ea5e9" dot={false} />
                      <Line type="monotone" dataKey="airQuality" name="AQI" stroke="#f59e0b" dot={false} />
                      <Line type="monotone" dataKey="traffic" name="Trafik" stroke="#64748b" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-950">Canli yenileme</h2>
                <p className="text-sm text-slate-500">Latest ve bolge gecmisi 5 sn, health 10 sn aralikla yenilenir.</p>
              </div>
              <RefreshCw
                className={`h-5 w-5 text-slate-500 ${latestQuery.isFetching || zoneQuery.isFetching ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
            </div>
          </section>
        </>
      ) : null}

      {!isInitialLoading && !hasError && latestReadings.length === 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Sensorler listelendi ancak son olcum bulunamadi. Simulator baslatildiktan sonra kartlar dolacaktir.
        </div>
      ) : null}
    </div>
  );
}
