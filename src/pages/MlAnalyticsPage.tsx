import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  BrainCircuit,
  Flame,
  RefreshCw,
  Sparkles,
  Thermometer,
  TrendingUp
} from "lucide-react";
import {
  generatePredictions,
  getLatestPredictions,
  getMlHealth,
  getModelStatus,
  getZonePredictions,
  getZoneRisk,
  trainModel
} from "../api/ml";
import { ErrorState, LoadingState } from "../components/DataState";
import { MetricCard } from "../components/MetricCard";
import { ConnectionBadge, StatusBadge } from "../components/StatusBadge";
import type { CityZone, CrowdLevel, Prediction, RiskLevel } from "../types";
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

const crowdClassName: Record<CrowdLevel, string> = {
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  medium: "border-sky-200 bg-sky-50 text-sky-700",
  high: "border-amber-200 bg-amber-50 text-amber-700",
  critical: "border-red-200 bg-red-50 text-red-700"
};

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(value));
}

function metricTone(level?: RiskLevel): "green" | "amber" | "red" {
  if (level === "critical") {
    return "red";
  }
  if (level === "warning") {
    return "amber";
  }
  return "green";
}

function CrowdBadge({ level }: { level: CrowdLevel }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${crowdClassName[level]}`}
    >
      {level}
    </span>
  );
}

function latestByZone(predictions: Prediction[]) {
  return zones
    .map((zone) => predictions.find((prediction) => prediction.zone === zone))
    .filter((prediction): prediction is Prediction => Boolean(prediction));
}

export function MlAnalyticsPage() {
  const queryClient = useQueryClient();
  const [selectedZone, setSelectedZone] = useState<CityZone>("Meydan");

  const healthQuery = useQuery({
    queryKey: ["ml", "health"],
    queryFn: getMlHealth,
    refetchInterval: 30000
  });
  const modelQuery = useQuery({
    queryKey: ["ml", "model", "status"],
    queryFn: getModelStatus,
    refetchInterval: 30000
  });
  const latestQuery = useQuery({
    queryKey: ["ml", "predictions", "latest"],
    queryFn: getLatestPredictions,
    refetchInterval: 10000
  });
  const historyQuery = useQuery({
    queryKey: ["ml", "predictions", selectedZone],
    queryFn: () => getZonePredictions(selectedZone, 50),
    refetchInterval: 10000
  });
  const zoneRiskQuery = useQuery({
    queryKey: ["ml", "zones", selectedZone, "risk"],
    queryFn: () => getZoneRisk(selectedZone),
    refetchInterval: 10000
  });

  const generateMutation = useMutation({
    mutationFn: generatePredictions,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ml"] })
  });
  const trainMutation = useMutation({
    mutationFn: trainModel,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ml"] })
  });

  const latestPredictions = latestQuery.data ?? [];
  const zonePredictions = useMemo(() => latestByZone(latestPredictions), [latestPredictions]);
  const avgRiskScore = average(zonePredictions.map((prediction) => prediction.risk_score));
  const criticalCount = zonePredictions.filter((prediction) => prediction.risk_level === "critical").length;
  const warningCount = zonePredictions.filter((prediction) => prediction.risk_level === "warning").length;
  const riskiestPrediction = [...zonePredictions].sort((first, second) => second.risk_score - first.risk_score)[0];

  useEffect(() => {
    if (!zonePredictions.some((prediction) => prediction.zone === selectedZone) && zonePredictions[0]) {
      setSelectedZone(zonePredictions[0].zone);
    }
  }, [selectedZone, zonePredictions]);

  const chartData = [...(historyQuery.data ?? [])].reverse().map((prediction) => ({
    time: formatTime(prediction.prediction_timestamp),
    risk: prediction.risk_score,
    temperature: Number(prediction.predicted_temperature.toFixed(1))
  }));

  const isInitialLoading = latestQuery.isLoading || modelQuery.isLoading;
  const hasError = latestQuery.isError || modelQuery.isError;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-950">ML Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">Tahminler, risk skorlari ve model operasyonlari</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ConnectionBadge active={healthQuery.data?.status === "ok"} label="ML API" />
          <ConnectionBadge active={modelQuery.data?.model_ready ?? false} label="Model" />
          <button
            type="button"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Tahmin uret
          </button>
          <button
            type="button"
            onClick={() => trainMutation.mutate()}
            disabled={trainMutation.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <BrainCircuit className="h-4 w-4" aria-hidden="true" />
            Modeli yeniden egit
          </button>
        </div>
      </div>

      {generateMutation.isError || trainMutation.isError ? (
        <ErrorState message="ML komutu gonderilemedi. ML Service ve bagimli servisleri kontrol edin." />
      ) : null}
      {isInitialLoading ? <LoadingState label="ML verileri yukleniyor" /> : null}
      {hasError ? <ErrorState message="ML Service verileri alinamadi." /> : null}

      {!isInitialLoading && !hasError ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Ortalama risk"
              value={Math.round(avgRiskScore)}
              detail="Son tahmin ortalamasi"
              icon={TrendingUp}
              tone={metricTone(riskiestPrediction?.risk_level)}
            />
            <MetricCard
              title="Critical bolge"
              value={criticalCount}
              detail="Acil takip gerektirir"
              icon={Flame}
              tone={criticalCount > 0 ? "red" : "green"}
            />
            <MetricCard
              title="Warning bolge"
              value={warningCount}
              detail="Yakindan izlenir"
              icon={AlertTriangle}
              tone={warningCount > 0 ? "amber" : "green"}
            />
            <MetricCard
              title="En riskli bolge"
              value={riskiestPrediction?.zone ?? "-"}
              detail={riskiestPrediction ? `${riskiestPrediction.risk_score} risk skoru` : "Tahmin bekleniyor"}
              icon={Thermometer}
              tone={metricTone(riskiestPrediction?.risk_level)}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-slate-950">Model status</h2>
                  <p className="text-sm text-slate-500">30 saniyede bir yenilenir</p>
                </div>
                <BrainCircuit className="h-5 w-5 text-sky-600" aria-hidden="true" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">trained</p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-950">{String(modelQuery.data?.trained ?? false)}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">training_samples</p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-950">{modelQuery.data?.training_samples ?? 0}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">trained_at</p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-950">{formatDateTime(modelQuery.data?.trained_at)}</p>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">model_ready</p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-950">{String(modelQuery.data?.model_ready ?? false)}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {zonePredictions.map((prediction) => {
                const selected = prediction.zone === selectedZone;

                return (
                  <button
                    type="button"
                    key={prediction.zone}
                    onClick={() => setSelectedZone(prediction.zone)}
                    className={`rounded-lg border bg-white p-4 text-left shadow-sm transition hover:border-sky-300 ${
                      selected ? "border-sky-600 ring-2 ring-sky-100" : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950">{prediction.zone}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatDateTime(prediction.prediction_for)}</p>
                      </div>
                      <StatusBadge level={prediction.risk_level} />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-md bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">Risk</p>
                        <p className="mt-1 text-lg font-semibold text-slate-950">{prediction.risk_score}</p>
                      </div>
                      <div className="rounded-md bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">Sicaklik</p>
                        <p className="mt-1 text-lg font-semibold text-slate-950">
                          {prediction.predicted_temperature.toFixed(1)} C
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <CrowdBadge level={prediction.predicted_crowd_level} />
                    </div>
                    <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">{prediction.recommendation}</p>
                  </button>
                );
              })}
              {!latestQuery.isFetching && zonePredictions.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Tahmin bulunamadi. Tahmin uret aksiyonu ile ML servisten yeni veri alinabilir.
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-950">{selectedZone} tahmin gecmisi</h2>
                <p className="text-sm text-slate-500">Risk skoru ve tahmini sicaklik zaman serisi</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {zoneRiskQuery.data ? <StatusBadge level={zoneRiskQuery.data.risk_level} /> : null}
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
              {historyQuery.isLoading ? (
                <LoadingState label="Tahmin gecmisi yukleniyor" />
              ) : historyQuery.isError ? (
                <ErrorState message="Tahmin gecmisi alinamadi." />
              ) : chartData.length === 0 ? (
                <div className="flex min-h-32 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 px-4 text-sm text-amber-800">
                  Secili bolge icin tahmin gecmisi bekleniyor.
                </div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="time" tick={{ fontSize: 12 }} minTickGap={28} />
                      <YAxis tick={{ fontSize: 12 }} width={36} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="risk" name="Risk skoru" stroke="#ef4444" dot={false} />
                      <Line type="monotone" dataKey="temperature" name="Tahmini sicaklik" stroke="#0ea5e9" dot={false} />
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
                <p className="text-sm text-slate-500">Latest ve bolge gecmisi 10 sn, model ve health 30 sn aralikla yenilenir.</p>
              </div>
              <RefreshCw
                className={`h-5 w-5 text-slate-500 ${
                  latestQuery.isFetching || historyQuery.isFetching || modelQuery.isFetching || healthQuery.isFetching
                    ? "animate-spin"
                    : ""
                }`}
                aria-hidden="true"
              />
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
