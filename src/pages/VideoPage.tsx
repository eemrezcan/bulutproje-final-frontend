import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Car,
  type LucideIcon,
  Pause,
  Play,
  RefreshCw,
  Sparkles,
  Users
} from "lucide-react";
import {
  generateAnalysis,
  getCameraAnalysis,
  getCameraStream,
  getCameras,
  getLatestAnalysis,
  getVideoHealth,
  getZoneAnalysis,
  startAnalyzer,
  stopAnalyzer
} from "../api/video";
import { ErrorState, LoadingState } from "../components/DataState";
import { ConnectionBadge } from "../components/StatusBadge";
import type { Camera, CityZone, CrowdLevel, MotionLevel, VideoAnalysisEvent } from "../types";
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

type HistoryMode = "camera" | "zone";

const crowdClassName: Record<CrowdLevel, string> = {
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  medium: "border-sky-200 bg-sky-50 text-sky-700",
  high: "border-amber-200 bg-amber-50 text-amber-700",
  critical: "border-red-200 bg-red-50 text-red-700"
};

const motionClassName: Record<MotionLevel, string> = {
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  high: "border-red-200 bg-red-50 text-red-700"
};

const levelScore: Record<CrowdLevel | MotionLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(value));
}

function LevelBadge({ level, type }: { level: CrowdLevel | MotionLevel; type: "crowd" | "motion" }) {
  const className = type === "crowd" ? crowdClassName[level as CrowdLevel] : motionClassName[level as MotionLevel];

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${className}`}>
      {level}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 truncate text-2xl font-semibold text-slate-950">{value}</p>
        </div>
        <div className="rounded-md bg-sky-50 p-2 text-sky-700">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

function latestForCamera(events: VideoAnalysisEvent[], cameraId?: string) {
  return events.find((event) => event.camera_id === cameraId);
}

export function VideoPage() {
  const queryClient = useQueryClient();
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [historyMode, setHistoryMode] = useState<HistoryMode>("camera");
  const [videoError, setVideoError] = useState(false);

  const camerasQuery = useQuery({ queryKey: ["video", "cameras"], queryFn: getCameras });
  const latestQuery = useQuery({
    queryKey: ["video", "analysis", "latest"],
    queryFn: getLatestAnalysis,
    refetchInterval: 3000
  });
  const healthQuery = useQuery({
    queryKey: ["video", "health"],
    queryFn: getVideoHealth,
    refetchInterval: 10000
  });

  const cameras = camerasQuery.data ?? [];
  const selectedCamera = cameras.find((camera) => camera.camera_id === selectedCameraId) ?? cameras[0];
  const selectedZone = selectedCamera?.zone;

  useEffect(() => {
    if (!selectedCameraId && cameras.length > 0) {
      setSelectedCameraId(cameras[0].camera_id);
    }
  }, [cameras, selectedCameraId]);

  const streamQuery = useQuery({
    queryKey: ["video", "cameras", selectedCamera?.camera_id, "stream"],
    queryFn: () => getCameraStream(selectedCamera.camera_id),
    enabled: Boolean(selectedCamera)
  });

  const historyQuery = useQuery({
    queryKey: ["video", "analysis", historyMode, selectedCamera?.camera_id, selectedZone],
    queryFn: () =>
      historyMode === "camera"
        ? getCameraAnalysis(selectedCamera.camera_id, 50)
        : getZoneAnalysis(selectedZone as CityZone, 50),
    enabled: Boolean(selectedCamera),
    refetchInterval: 5000
  });

  const startMutation = useMutation({
    mutationFn: startAnalyzer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["video"] })
  });
  const stopMutation = useMutation({
    mutationFn: stopAnalyzer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["video"] })
  });
  const generateMutation = useMutation({
    mutationFn: generateAnalysis,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["video", "analysis"] })
  });

  const latestEvents = latestQuery.data ?? [];
  const selectedLatest = latestForCamera(latestEvents, selectedCamera?.camera_id) ?? historyQuery.data?.[0];
  const eventsByCamera = useMemo(
    () => new Map(latestEvents.map((event) => [event.camera_id, event])),
    [latestEvents]
  );

  const chartData = [...(historyQuery.data ?? [])].reverse().map((event) => ({
    time: formatTime(event.timestamp),
    people: event.people_count,
    vehicles: event.vehicle_count,
    crowd: levelScore[event.crowd_level],
    motion: levelScore[event.motion_level]
  }));

  const isInitialLoading = camerasQuery.isLoading || latestQuery.isLoading;
  const hasError = camerasQuery.isError || latestQuery.isError;

  useEffect(() => {
    setVideoError(false);
  }, [streamQuery.data?.stream_url]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-950">Video</h1>
          <p className="mt-1 text-sm text-slate-500">Kamera izleme, video akis ve analiz operasyonlari</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ConnectionBadge active={healthQuery.data?.status === "ok"} label="Video API" />
          <ConnectionBadge active={healthQuery.data?.analyzer_running ?? false} label="Analyzer" />
          <button
            type="button"
            onClick={() => startMutation.mutate()}
            disabled={startMutation.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            Start
          </button>
          <button
            type="button"
            onClick={() => stopMutation.mutate()}
            disabled={stopMutation.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Pause className="h-4 w-4" aria-hidden="true" />
            Stop
          </button>
          <button
            type="button"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Analiz uret
          </button>
        </div>
      </div>

      {startMutation.isError || stopMutation.isError || generateMutation.isError ? (
        <ErrorState message="Video komutu gonderilemedi. Video Service ve Docker servislerini kontrol edin." />
      ) : null}
      {isInitialLoading ? <LoadingState /> : null}
      {hasError ? <ErrorState message="Video Service verileri alinamadi." /> : null}

      {!isInitialLoading && !hasError ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {cameras.map((camera) => {
              const latest = eventsByCamera.get(camera.camera_id);
              const selected = camera.camera_id === selectedCamera?.camera_id;

              return (
                <button
                  type="button"
                  key={camera.camera_id}
                  onClick={() => setSelectedCameraId(camera.camera_id)}
                  className={`rounded-lg border bg-white p-4 text-left shadow-sm transition hover:border-sky-300 ${
                    selected ? "border-sky-600 ring-2 ring-sky-100" : "border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">{camera.name}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">{camera.zone}</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      {camera.status}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <span className="truncate">Kisi {latest?.people_count ?? "-"}</span>
                    <span className="truncate">Arac {latest?.vehicle_count ?? "-"}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {latest ? <LevelBadge level={latest.crowd_level} type="crowd" /> : null}
                    {latest ? <LevelBadge level={latest.motion_level} type="motion" /> : null}
                  </div>
                </button>
              );
            })}
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-slate-950">{selectedCamera?.name}</h2>
                  <p className="truncate text-sm text-slate-500">
                    {streamQuery.data?.mode ?? "looped_synthetic_media"} - {streamQuery.data?.media_type ?? "video/mp4"}
                  </p>
                </div>
                <ConnectionBadge active={streamQuery.data?.playable ?? false} label="Video stream" />
              </div>
              <div className="bg-slate-950 p-3">
                {streamQuery.isLoading ? (
                  <div className="flex aspect-video items-center justify-center text-sm text-slate-300">Video yukleniyor</div>
                ) : streamQuery.isError || !streamQuery.data?.stream_url ? (
                  <div className="flex aspect-video items-center justify-center text-sm text-slate-300">Video akisi alinamadi</div>
                ) : (
                  <div className="relative">
                    <video
                      key={streamQuery.data.stream_url}
                      className="aspect-video w-full rounded-md bg-black object-cover"
                      src={streamQuery.data.stream_url}
                      crossOrigin="anonymous"
                      loop
                      muted
                      controls
                      autoPlay
                      playsInline
                      onLoadedData={() => setVideoError(false)}
                      onError={() => setVideoError(true)}
                    />
                    {videoError ? (
                      <div className="absolute inset-x-3 bottom-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 shadow-sm">
                        Video kaynagi alindi, ancak tarayici bu medya kodlamasini oynatamadi.
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <StatCard label="Kisi sayisi" value={selectedLatest?.people_count ?? "-"} icon={Users} />
                <StatCard label="Arac sayisi" value={selectedLatest?.vehicle_count ?? "-"} icon={Car} />
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950">Son analiz</p>
                  <p className="text-xs text-slate-500">
                    {selectedLatest ? formatTime(selectedLatest.timestamp) : "Bekleniyor"}
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-md bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Kalabalik</p>
                    <div className="mt-2">{selectedLatest ? <LevelBadge level={selectedLatest.crowd_level} type="crowd" /> : "-"}</div>
                  </div>
                  <div className="rounded-md bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Hareket</p>
                    <div className="mt-2">{selectedLatest ? <LevelBadge level={selectedLatest.motion_level} type="motion" /> : "-"}</div>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="mb-2 text-xs font-medium uppercase text-slate-500">Recognition labels</p>
                  <div className="flex flex-wrap gap-2">
                    {(selectedLatest?.recognition_labels ?? []).map((label) => (
                      <span key={label} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">
                        {label}
                      </span>
                    ))}
                    {!selectedLatest?.recognition_labels.length ? <span className="text-sm text-slate-500">Etiket yok</span> : null}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-950">Analiz gecmisi</h2>
                <p className="text-sm text-slate-500">5 saniyede bir yenilenen son 50 video analiz eventi</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setHistoryMode("camera")}
                  className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                    historyMode === "camera"
                      ? "border-sky-600 bg-sky-50 text-sky-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Kamera
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryMode("zone")}
                  className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                    historyMode === "zone"
                      ? "border-sky-600 bg-sky-50 text-sky-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Bolge
                </button>
              </div>
            </div>
            <div className="p-4">
              {historyQuery.isLoading ? (
                <LoadingState label="Analiz gecmisi yukleniyor" />
              ) : historyQuery.isError ? (
                <ErrorState message="Analiz gecmisi alinamadi." />
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="time" tick={{ fontSize: 12 }} minTickGap={28} />
                      <YAxis tick={{ fontSize: 12 }} width={36} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="people" name="Kisi" stroke="#0ea5e9" dot={false} />
                      <Line type="monotone" dataKey="vehicles" name="Arac" stroke="#64748b" dot={false} />
                      <Line type="monotone" dataKey="crowd" name="Kalabalik skoru" stroke="#f59e0b" dot={false} />
                      <Line type="monotone" dataKey="motion" name="Hareket skoru" stroke="#ef4444" dot={false} />
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
                <p className="text-sm text-slate-500">Latest 3 sn, gecmis 5 sn, health 10 sn aralikla yenilenir.</p>
              </div>
              <RefreshCw
                className={`h-5 w-5 text-slate-500 ${
                  latestQuery.isFetching || historyQuery.isFetching || healthQuery.isFetching ? "animate-spin" : ""
                }`}
                aria-hidden="true"
              />
            </div>
          </section>
        </>
      ) : null}

      {!isInitialLoading && !hasError && cameras.length === 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Kamera bulunamadi. Video Service seed verilerini ve DynamoDB Local durumunu kontrol edin.
        </div>
      ) : null}
    </div>
  );
}
