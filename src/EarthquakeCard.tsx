import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { geoDistance, geoOrthographic, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import landTopology from "world-atlas/land-110m.json";

const EARTHQUAKES_URL =
  "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson";
const GLOBE_SIZE = 420;
const GLOBE_RADIUS = 190;

type Status = "loading" | "loaded" | "error";

interface Earthquake {
  id: string;
  longitude: number;
  latitude: number;
  depthKm: number | null;
  magnitude: number | null;
  place: string;
  time: number | null;
  url: string | null;
}

interface DragStart {
  pointerId: number;
  x: number;
  y: number;
  rotation: [number, number];
}

const topology = landTopology as unknown as Parameters<typeof feature>[0];
const land = feature(topology, topology.objects.land);

function validNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function validUsgsUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "earthquake.usgs.gov"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function parseEarthquakes(json: unknown): Earthquake[] {
  if (!json || typeof json !== "object" || !("features" in json)) {
    throw new Error("Earthquake response has no features array");
  }
  const features = (json as { features: unknown }).features;
  if (!Array.isArray(features)) {
    throw new Error("Earthquake response has no features array");
  }

  return features.flatMap((raw, index): Earthquake[] => {
    if (!raw || typeof raw !== "object") return [];
    const item = raw as Record<string, unknown>;
    const geometry = item.geometry as { coordinates?: unknown } | null;
    const coordinates = geometry?.coordinates;
    if (!Array.isArray(coordinates)) return [];
    const longitude = validNumber(coordinates[0]);
    const latitude = validNumber(coordinates[1]);
    if (
      longitude === null || latitude === null ||
      longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90
    ) return [];

    const properties = item.properties && typeof item.properties === "object"
      ? item.properties as Record<string, unknown>
      : {};
    const time = validNumber(properties.time);
    return [{
      id: typeof item.id === "string" ? item.id : `event-${index}`,
      longitude,
      latitude,
      depthKm: validNumber(coordinates[2]),
      magnitude: validNumber(properties.mag),
      place: typeof properties.place === "string" && properties.place.trim()
        ? properties.place
        : "Location unavailable",
      time: time !== null && !Number.isNaN(new Date(time).getTime()) ? time : null,
      url: validUsgsUrl(properties.url),
    }];
  });
}

function formatTime(time: number | null): string {
  if (time === null) return "Time unavailable";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", timeZoneName: "short",
  }).format(time);
}

function formatMagnitude(magnitude: number | null): string {
  return magnitude === null ? "Magnitude unavailable" : `M ${magnitude.toFixed(1)}`;
}

function markerRadius(magnitude: number | null): number {
  return magnitude === null ? 4 : Math.max(4, Math.min(10, 4 + magnitude * 0.8));
}

export function EarthquakeCard() {
  const [status, setStatus] = useState<Status>("loading");
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rotation, setRotation] = useState<[number, number]>([0, 0]);
  const [attempt, setAttempt] = useState(0);
  const drag = useRef<DragStart | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    setEarthquakes([]);
    setSelectedId(null);

    fetch(EARTHQUAKES_URL, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`USGS request failed: ${response.status}`);
        return response.json();
      })
      .then((json: unknown) => {
        if (controller.signal.aborted) return;
        const events = parseEarthquakes(json);
        setEarthquakes(events);
        if (events.length > 0) {
          const largest = events.reduce((best, event) =>
            (event.magnitude ?? -Infinity) > (best.magnitude ?? -Infinity) ? event : best
          );
          setRotation([-largest.longitude, -largest.latitude]);
          setSelectedId(largest.id);
        }
        setStatus("loaded");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.error(error);
        setStatus("error");
      });

    return () => controller.abort();
  }, [attempt]);

  const projection = useMemo(() => geoOrthographic()
    .scale(GLOBE_RADIUS)
    .translate([GLOBE_SIZE / 2, GLOBE_SIZE / 2])
    .rotate(rotation)
    .clipAngle(90), [rotation]);
  const landPath = useMemo(() => geoPath(projection)(land), [projection]);
  const selected = earthquakes.find((event) => event.id === selectedId) ?? null;
  const visibleEvents = earthquakes.flatMap((event) => {
    const point: [number, number] = [event.longitude, event.latitude];
    const center: [number, number] = [-rotation[0], -rotation[1]];
    if (geoDistance(point, center) > Math.PI / 2) return [];
    const projected = projection(point);
    return projected ? [{ event, x: projected[0], y: projected[1] }] : [];
  });

  const retry = useCallback(() => setAttempt((previous) => previous + 1), []);
  const selectEvent = useCallback((event: Earthquake) => {
    setSelectedId(event.id);
    setRotation([-event.longitude, -event.latitude]);
  }, []);

  const onPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.button !== 0 || (event.target as Element).closest("[data-earthquake-marker]")) return;
    drag.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      rotation,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const start = drag.current;
    if (!start || start.pointerId !== event.pointerId) return;
    const longitude = start.rotation[0] + (event.clientX - start.x) * 0.35;
    const latitude = Math.max(-85, Math.min(85,
      start.rotation[1] - (event.clientY - start.y) * 0.35,
    ));
    setRotation([longitude, latitude]);
  };
  const onPointerEnd = (event: React.PointerEvent<SVGSVGElement>) => {
    if (drag.current?.pointerId === event.pointerId) drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <section className="rounded-lg border border-gray-200 p-5 sm:col-span-2" aria-labelledby="earthquake-title">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="earthquake-title" className="text-xl font-semibold">Where are earthquakes happening?</h2>
        <span className="text-sm text-gray-600">Past 24 hours · USGS</span>
      </div>

      {status === "loading" && (
        <p className="mt-4 text-gray-600" role="status">Loading earthquakes…</p>
      )}

      {status === "error" && (
        <div className="mt-4 rounded bg-red-50 p-4 text-red-900" role="alert">
          <p>Couldn&apos;t load earthquakes from USGS.</p>
          <button type="button" onClick={retry}
            className="mt-3 rounded bg-red-700 px-3 py-1 font-medium text-white hover:bg-red-800">
            Try again
          </button>
        </div>
      )}

      {status === "loaded" && earthquakes.length === 0 && (
        <p className="mt-4 text-gray-600" role="status">No earthquakes found in the past 24 hours.</p>
      )}

      {status === "loaded" && earthquakes.length > 0 && (
        <div className="mt-4 grid items-center gap-5 md:grid-cols-[minmax(0,1fr)_minmax(15rem,0.8fr)]">
          <div>
            <svg viewBox={`0 0 ${GLOBE_SIZE} ${GLOBE_SIZE}`}
              className="earthquake-globe mx-auto block w-full max-w-[420px] cursor-grab select-none active:cursor-grabbing"
              role="group" aria-label="Drag to rotate the globe; select a red earthquake point"
              onPointerDown={onPointerDown} onPointerMove={onPointerMove}
              onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd}>
              <defs>
                <clipPath id="earthquake-globe-clip">
                  <circle cx={210} cy={210} r={GLOBE_RADIUS} />
                </clipPath>
              </defs>
              <circle cx={210} cy={210} r={GLOBE_RADIUS} fill="#dbeafe" stroke="#93c5fd" strokeWidth="2" />
              {landPath && <path d={landPath} fill="#d1d5db" stroke="#9ca3af" strokeWidth="0.8" />}
              <g clipPath="url(#earthquake-globe-clip)">
                {visibleEvents.map(({ event, x, y }) => (
                <circle key={event.id} data-earthquake-marker="true" cx={x} cy={y}
                  r={markerRadius(event.magnitude)} fill="#dc2626" stroke="#fff"
                  strokeWidth={selectedId === event.id ? 3 : 1.5}
                  role="button" tabIndex={0}
                  aria-label={`${formatMagnitude(event.magnitude)}, ${event.place}, ${formatTime(event.time)}`}
                  aria-pressed={selectedId === event.id}
                  onClick={() => selectEvent(event)}
                  onKeyDown={(keyEvent) => {
                    if (keyEvent.key === "Enter" || keyEvent.key === " ") {
                      keyEvent.preventDefault();
                      selectEvent(event);
                    }
                  }}>
                  <title>{`${formatMagnitude(event.magnitude)} · ${event.place}`}</title>
                </circle>
                ))}
              </g>
            </svg>
            <p className="mt-1 text-center text-sm text-gray-600">Drag to rotate · Select a red point for details</p>
          </div>

          <div className="min-w-0">
            <label htmlFor="earthquake-select" className="block text-sm font-medium text-gray-700">
              Choose an earthquake ({earthquakes.length} total)
            </label>
            <select id="earthquake-select" value={selectedId ?? ""}
              onChange={(changeEvent) => {
                const event = earthquakes.find((item) => item.id === changeEvent.target.value);
                if (event) selectEvent(event);
              }}
              className="mt-1 w-full rounded border border-gray-300 bg-white p-2 text-sm">
              {earthquakes.map((event) => (
                <option key={event.id} value={event.id}>
                  {formatMagnitude(event.magnitude)} · {event.place}
                </option>
              ))}
            </select>

            {selected && (
              <div className="mt-4 rounded-lg bg-gray-50 p-4" aria-live="polite">
                <p className="text-2xl font-bold text-red-700">{formatMagnitude(selected.magnitude)}</p>
                <p className="mt-1 font-medium">{selected.place}</p>
                <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
                  <dt className="text-gray-600">Time</dt><dd>{formatTime(selected.time)}</dd>
                  <dt className="text-gray-600">Depth</dt>
                  <dd>{selected.depthKm === null ? "Depth unavailable" : `${selected.depthKm.toFixed(1)} km`}</dd>
                </dl>
                {selected.url && (
                  <a href={selected.url} target="_blank" rel="noopener noreferrer"
                    className="mt-3 inline-block font-medium text-blue-700 underline hover:text-blue-900">
                    View event on USGS
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
