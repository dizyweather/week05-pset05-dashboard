import { useCallback, useEffect, useState } from "react";
import fallback from "./data/fallback.json";
import { EarthquakeCard } from "./EarthquakeCard";
import { LastUpdated } from "./LastUpdated";
import { OnThisDayCard } from "./OnThisDayCard";

/**
 * One card, wired end to end, so you can see the shape before you build your
 * own. Every card on this dashboard needs all three faces:
 *
 *   loading — what the user sees while the request is in flight
 *   loaded  — the data
 *   error   — an honest failure with a way to try again
 *
 * The weather source is Open-Meteo. It needs no account and no API key, which
 * is why nothing secret ever enters this project. Read the raw JSON yourself
 * before you map it: open the URL below in a browser tab.
 *
 * `data_sources.md` lists every source you can use, with its URL.
 */
const WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast" +
  "?latitude=40.015&longitude=-105.2705" +
  "&current=temperature_2m,weather_code&temperature_unit=fahrenheit";

interface WeatherNow {
  temperatureF: number | null;
  weatherCode: number | null;
  observedAt: string;
}

/**
 * Map the API's JSON onto the three values this card actually shows. Every
 * field you pull out here earns a row in `json_field_map.md`:
 *
 *   current.temperature_2m → the big number
 *   current.weather_code   → the description underneath it
 *   current.time           → the "observed at" line
 *
 * Each row also records what the card does when the field is missing. This
 * function is where you decide that, so the map and the code agree.
 */
function toWeatherNow(json: unknown): WeatherNow {
  const current = (json as { current?: Record<string, unknown> }).current;
  if (!current) throw new Error("response had no `current` object");
  return {
    temperatureF: typeof current.temperature_2m === "number" && Number.isFinite(current.temperature_2m)
      ? current.temperature_2m : null,
    weatherCode: typeof current.weather_code === "number" && Number.isFinite(current.weather_code)
      ? current.weather_code : null,
    observedAt: typeof current.time === "string" ? current.time : "",
  };
}

function formatObservedAt(value: string): string {
  if (!value) return "Observation time unavailable";
  // This request does not set a timezone, so Open-Meteo returns its time in GMT.
  const observed = new Date(`${value}Z`);
  if (Number.isNaN(observed.getTime())) return "Observation time unavailable";
  return `Observed ${new Intl.DateTimeFormat(undefined, {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    timeZoneName: "short",
  }).format(observed)}`;
}

/** A few of Open-Meteo's WMO weather codes. Anything unlisted shows the code. */
const WEATHER_LABELS: Record<number, string> = {
  0: "Clear",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  61: "Light rain",
  63: "Rain",
  71: "Light snow",
  73: "Snow",
  95: "Thunderstorm",
};

type Status = "loading" | "loaded" | "error";

/**
 * Where the numbers on screen came from. This is deliberately separate from
 * `status`: a card showing bundled sample data is *loaded*, not *failed*, and
 * the user has to be able to tell the two apart at a glance. Showing stale or
 * canned data without saying so is a lie, and it is the most common way a
 * dashboard misleads the person reading it.
 */
type Source = "live" | "sample";

function WeatherCard() {
  const [status, setStatus] = useState<Status>("loading");
  const [source, setSource] = useState<Source>("live");
  const [weather, setWeather] = useState<WeatherNow | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // Aborting on cleanup is what stops a slow response from landing after the
    // component is gone, and what keeps a fast reload from doubling requests.
    const controller = new AbortController();
    setStatus("loading");
    setSource("live");
    setWeather(null);

    fetch(WEATHER_URL, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`weather request failed: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setWeather(toWeatherNow(json));
        setLastUpdated(Date.now());
        setStatus("loaded");
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        console.error(err);
        // Note what this does NOT do: it does not quietly fill the card with
        // the bundled sample. The failure gets its own face, so you can see it
        // and screenshot it. The sample is one click away, clearly labelled.
        setStatus("error");
      });

    return () => controller.abort();
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  /** The offline escape hatch: bundled data, shown only when asked for. */
  const useSample = useCallback(() => {
    setWeather(fallback.weather);
    setLastUpdated(null);
    setSource("sample");
    setStatus("loaded");
  }, []);

  return (
    <section className="dashboard-card weather-card" aria-labelledby="weather-title">
      <p className="eyebrow">Local weather · Boulder, Colorado</p>
      <h2 id="weather-title" className="card-title mt-2">Do I need a coat?</h2>

      {status === "loading" && (
        <p className="supporting-text mt-4" aria-live="polite">
          Loading weather…
        </p>
      )}

      {status === "loaded" && weather && (
        <div className="mt-5">
          {source === "sample" && (
            <p className="sample-badge mb-3">
              Sample data — not live
            </p>
          )}
          <p className="weather-value">
            {weather.temperatureF === null ? "--°F" : `${Math.round(weather.temperatureF)}°F`}
          </p>
          <p className="mt-1">
            {weather.weatherCode === null
              ? "Condition unavailable"
              : WEATHER_LABELS[weather.weatherCode] ?? `Weather code ${weather.weatherCode}`}
          </p>
          <p className="supporting-text mt-2 text-sm">
            {formatObservedAt(weather.observedAt)}
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="error-panel mt-4 text-sm" role="alert">
          <p>Couldn&apos;t reach the weather service.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={retry}
              className="action-button"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={useSample}
              className="secondary-button"
            >
              Show sample data
            </button>
          </div>
        </div>
      )}
      {status === "loaded" && source === "live" && <LastUpdated at={lastUpdated} className="mt-auto pt-3" />}
    </section>
  );
}

export function App() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-5 py-8 sm:p-8">
      <header className="dashboard-header">
        <p className="eyebrow mb-2">A daily briefing</p>
        <h1 className="page-title">Morning Field Notes</h1>
        <p className="supporting-text mt-2">
          Your weather in Boulder, earthquakes around the world, and moments from history.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <WeatherCard />
        <OnThisDayCard />
        <EarthquakeCard />
      </div>
    </main>
  );
}
