import { useCallback, useEffect, useState } from "react";
import fallback from "./data/fallback.json";
import { EarthquakeCard } from "./EarthquakeCard";

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
    setSource("sample");
    setStatus("loaded");
  }, []);

  return (
    <section className="rounded-lg border border-gray-200 p-5">
      <h2 className="text-xl font-semibold">Do I need a coat?</h2>

      {status === "loading" && (
        <p className="mt-3 text-gray-600" aria-live="polite">
          Loading weather…
        </p>
      )}

      {status === "loaded" && weather && (
        <div className="mt-3">
          {source === "sample" && (
            <p className="mb-2 inline-block rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900">
              Sample data — not live
            </p>
          )}
          <p className="text-4xl font-bold">
            {weather.temperatureF === null ? "--°F" : `${Math.round(weather.temperatureF)}°F`}
          </p>
          <p className="text-gray-700">
            {weather.weatherCode === null
              ? "Condition unavailable"
              : WEATHER_LABELS[weather.weatherCode] ?? `Weather code ${weather.weatherCode}`}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {weather.observedAt ? `Observed ${weather.observedAt}` : "Observation time unavailable"}
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="mt-3 rounded bg-red-50 p-3 text-sm text-red-900">
          <p>Couldn&apos;t reach the weather service.</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={retry}
              className="rounded bg-red-700 px-3 py-1 font-medium text-white hover:bg-red-800"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={useSample}
              className="rounded border border-red-700 px-3 py-1 font-medium text-red-800 hover:bg-red-100"
            >
              Show sample data
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export function App() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-8">
      <header>
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        <p className="text-gray-700">
          A quick look at the weather and earthquakes around the world.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2">
        <WeatherCard />
        <EarthquakeCard />
      </div>
    </main>
  );
}
