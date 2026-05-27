import { useEffect, useRef } from "react";
import L from "leaflet";
import type { Sensor, SensorReading } from "../types";

interface SensorMapProps {
  sensors: Sensor[];
  latestReadings: SensorReading[];
}

const statusColor = {
  normal: "#10b981",
  warning: "#f59e0b",
  critical: "#ef4444"
};

export function SensorMap({ sensors, latestReadings }: SensorMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = L.map(containerRef.current, {
      center: [39.925, 32.82],
      zoom: 11,
      scrollWheelZoom: false
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap"
    }).addTo(map);

    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) {
      return;
    }

    layer.clearLayers();
    const readingsBySensor = new Map(latestReadings.map((reading) => [reading.sensor_id, reading]));

    sensors.forEach((sensor) => {
      const reading = readingsBySensor.get(sensor.sensor_id);
      const color = reading ? statusColor[reading.status_level] : "#64748b";
      L.circleMarker([sensor.latitude, sensor.longitude], {
        radius: 9,
        color,
        fillColor: color,
        fillOpacity: 0.8,
        weight: 2
      })
        .bindPopup(
          `<strong>${sensor.zone}</strong><br/>${sensor.name}<br/>${
            reading ? `${reading.temperature.toFixed(1)} C | AQI ${reading.air_quality_index}` : "Olcum bekleniyor"
          }`
        )
        .addTo(layer);
    });
  }, [latestReadings, sensors]);

  return <div ref={containerRef} className="h-80 overflow-hidden rounded-lg border border-slate-200" />;
}
