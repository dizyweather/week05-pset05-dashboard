import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { geoDistance, geoOrthographic, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import landTopology from "world-atlas/land-110m.json";
import { LastUpdated } from "./LastUpdated";

const EARTHQUAKES_URL =
  "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson";
const GLOBE_SIZE = 420;
const GLOBE_RADIUS = 190;
const ROTATION_DURATION_MS = 650;

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
const errorLandPath = geoPath(geoOrthographic()
  .scale(GLOBE_RADIUS)
  .translate([GLOBE_SIZE / 2, GLOBE_SIZE / 2])
  .rotate([-15, -10])
  .clipAngle(90))(land);

function CrackedGlobe() {
  const crack = "M 208 20 L 191 70 L 222 112 L 190 155 L 213 198 L 187 239 L 219 279 L 192 322 L 211 363 L 201 400";

  return (
    <svg viewBox={`0 0 ${GLOBE_SIZE} ${GLOBE_SIZE}`} className="cracked-globe"
      aria-hidden="true" focusable="false">
      <defs>
        <clipPath id="cracked-globe-clip">
          <circle cx={GLOBE_SIZE / 2} cy={GLOBE_SIZE / 2} r={GLOBE_RADIUS} />
        </clipPath>
      </defs>
      <circle className="globe-ocean" cx={210} cy={210} r={GLOBE_RADIUS} strokeWidth="2" />
      {errorLandPath && <path className="globe-land" d={errorLandPath} strokeWidth="1.2" />}
      <g clipPath="url(#cracked-globe-clip)">
        <path className="globe-crack-edge" d={crack} />
        <path className="globe-crack-gap" d={crack} />
      </g>
    </svg>
  );
}

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const drag = useRef<DragStart | null>(null);
  const rotationRef = useRef<[number, number]>([0, 0]);
  const animationFrame = useRef<number | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);

  const setGlobeRotation = useCallback((next: [number, number]) => {
    rotationRef.current = next;
    setRotation(next);
  }, []);
  const stopRotation = useCallback(() => {
    if (animationFrame.current !== null) {
      cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    }
  }, []);

  useEffect(() => stopRotation, [stopRotation]);

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
    selectedIdRef.current = event.id;
    setSelectedId(event.id);
    stopRotation();
    const start = rotationRef.current;
    const target: [number, number] = [-event.longitude, -event.latitude];
    const longitudeDelta = ((target[0] - start[0]) % 360 + 540) % 360 - 180;
    const latitudeDelta = target[1] - start[1];

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      (Math.abs(longitudeDelta) < 0.01 && Math.abs(latitudeDelta) < 0.01)) {
      setGlobeRotation([start[0] + longitudeDelta, target[1]]);
      return;
    }

    const startedAt = performance.now();
    const animate = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / ROTATION_DURATION_MS);
      const eased = progress < 0.5
        ? 4 * progress ** 3
        : 1 - (-2 * progress + 2) ** 3 / 2;
      setGlobeRotation([
        start[0] + longitudeDelta * eased,
        start[1] + latitudeDelta * eased,
      ]);
      animationFrame.current = progress < 1 ? requestAnimationFrame(animate) : null;
    };
    animationFrame.current = requestAnimationFrame(animate);
  }, [setGlobeRotation, stopRotation]);

  useEffect(() => {
    const controller = new AbortController();
    const isRefresh = hasLoadedRef.current;
    setRefreshError(false);
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setStatus("loading");
      setEarthquakes([]);
      selectedIdRef.current = null;
      setSelectedId(null);
    }

    fetch(EARTHQUAKES_URL, { signal: controller.signal, cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`USGS request failed: ${response.status}`);
        return response.json();
      })
      .then((json: unknown) => {
        if (controller.signal.aborted) return;
        const events = parseEarthquakes(json);
        const retained = events.find((event) => event.id === selectedIdRef.current);
        setEarthquakes(events);
        if (!retained && events.length > 0) {
          const largest = events.reduce((best, event) =>
            (event.magnitude ?? -Infinity) > (best.magnitude ?? -Infinity) ? event : best
          );
          if (isRefresh) selectEvent(largest);
          else {
            selectedIdRef.current = largest.id;
            setSelectedId(largest.id);
            setGlobeRotation([-largest.longitude, -largest.latitude]);
          }
        } else if (events.length === 0) {
          stopRotation();
          selectedIdRef.current = null;
          setSelectedId(null);
        }
        hasLoadedRef.current = true;
        setLastUpdated(Date.now());
        setStatus("loaded");
        setIsRefreshing(false);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.error(error);
        if (isRefresh) setRefreshError(true);
        else setStatus("error");
        setIsRefreshing(false);
      });

    return () => controller.abort();
  }, [attempt, selectEvent, setGlobeRotation, stopRotation]);

  const onPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.button !== 0 || (event.target as Element).closest("[data-earthquake-marker]")) return;
    stopRotation();
    drag.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      rotation: rotationRef.current,
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
    setGlobeRotation([longitude, latitude]);
  };
  const onPointerEnd = (event: React.PointerEvent<SVGSVGElement>) => {
    if (drag.current?.pointerId === event.pointerId) drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <section className="dashboard-card earthquake-card md:col-span-2" aria-labelledby="earthquake-title">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="eyebrow">Global activity</p>
          <h2 id="earthquake-title" className="card-title mt-2">Where are earthquakes happening?</h2>
        </div>
        <div className="quake-header-meta">
          <span className="supporting-text text-sm">Past 24 hours · USGS</span>
          {status === "loaded" && (
            <button type="button" className="secondary-button quake-refresh-button"
              onClick={retry} disabled={isRefreshing}>
              {isRefreshing ? "Refreshing…" : "Refresh earthquakes"}
            </button>
          )}
          <LastUpdated at={lastUpdated} />
        </div>
      </div>

      {refreshError && (
        <p className="quake-refresh-error mt-3" role="alert">
          Couldn&apos;t refresh earthquakes. Showing the last successful data.
        </p>
      )}

      {status === "loading" && (
        <p className="supporting-text mt-4" role="status">Loading earthquakes…</p>
      )}

      {status === "error" && (
        <div className="error-panel quake-error-panel mt-4" role="alert">
          <CrackedGlobe />
          <div>
            <p className="quake-error-title">Earthquake data unavailable</p>
            <p className="mt-1">Couldn&apos;t load earthquakes from USGS.</p>
            <button type="button" onClick={retry}
              className="action-button mt-3">
              Try again
            </button>
          </div>
        </div>
      )}

      {status === "loaded" && earthquakes.length === 0 && (
        <p className="supporting-text mt-4" role="status">No earthquakes found in the past 24 hours.</p>
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
              <circle className="globe-ocean" cx={210} cy={210} r={GLOBE_RADIUS} strokeWidth="2" />
              {landPath && <path className="globe-land" d={landPath} strokeWidth="1.2" />}
              <g clipPath="url(#earthquake-globe-clip)">
                {visibleEvents.map(({ event, x, y }) => (
                  <circle key={event.id} data-earthquake-marker="true" className="quake-marker" cx={x} cy={y}
                    r={markerRadius(event.magnitude)} strokeWidth={selectedId === event.id ? 3 : 1.5}
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
            <p className="supporting-text mt-1 text-center text-sm">Drag to rotate · Select a red point for details</p>
          </div>

          <div className="min-w-0">
            <label htmlFor="earthquake-select" className="block text-sm font-semibold">
              Choose an earthquake ({earthquakes.length} total)
            </label>
            <select id="earthquake-select" value={selectedId ?? ""}
              onChange={(changeEvent) => {
                const event = earthquakes.find((item) => item.id === changeEvent.target.value);
                if (event) selectEvent(event);
              }}
              className="field-select mt-2 text-sm">
              {earthquakes.map((event) => (
                <option key={event.id} value={event.id}>
                  {formatMagnitude(event.magnitude)} · {event.place}
                </option>
              ))}
            </select>

            {selected && (
              <div className="event-detail mt-4" aria-live="polite">
                <p className="event-magnitude">{formatMagnitude(selected.magnitude)}</p>
                <p className="mt-1 font-medium">{selected.place}</p>
                <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
                  <dt className="supporting-text">Time</dt><dd>{formatTime(selected.time)}</dd>
                  <dt className="supporting-text">Depth</dt>
                  <dd>{selected.depthKm === null ? "Depth unavailable" : `${selected.depthKm.toFixed(1)} km`}</dd>
                </dl>
                {selected.url && (
                  <a href={selected.url} target="_blank" rel="noopener noreferrer"
                    className="text-link mt-3 inline-block font-medium">
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
