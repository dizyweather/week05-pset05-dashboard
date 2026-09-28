import { useEffect, useState } from "react";
import fallback from "./data/fallback.json";
import { LastUpdated } from "./LastUpdated";

const WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast" +
  "?latitude=40.015&longitude=-105.2705" +
  "&current=temperature_2m,weather_code,apparent_temperature,wind_speed_10m" +
  "&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
  "&temperature_unit=fahrenheit&wind_speed_unit=mph" +
  "&timezone=America%2FDenver&forecast_days=1";

interface WeatherReport {
  temperatureF: number | null;
  weatherCode: number | null;
  feelsLikeF: number | null;
  windMph: number | null;
  highF: number | null;
  lowF: number | null;
  peakPrecipChance: number | null;
  observedAt: string;
}

const WEATHER_LABELS: Record<number, string> = {
  0: "Clear sky", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Foggy", 48: "Icy fog", 51: "Light drizzle", 53: "Drizzle",
  55: "Heavy drizzle", 56: "Freezing drizzle", 57: "Heavy freezing drizzle",
  61: "Light rain", 63: "Rain", 65: "Heavy rain", 66: "Freezing rain",
  67: "Heavy freezing rain", 71: "Light snow", 73: "Snow", 75: "Heavy snow",
  77: "Snow grains", 80: "Light showers", 81: "Showers", 82: "Heavy showers",
  85: "Light snow showers", 86: "Heavy snow showers", 95: "Thunderstorm",
  96: "Thunderstorm with hail", 99: "Heavy thunderstorm with hail",
};

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function firstNumber(value: unknown): number | null {
  return Array.isArray(value) ? finiteNumber(value[0]) : null;
}

function toWeatherReport(json: unknown): WeatherReport {
  if (typeof json !== "object" || json === null) throw new Error("Invalid weather response");
  const response = json as { current?: Record<string, unknown>; daily?: Record<string, unknown> };
  if (!response.current || typeof response.current !== "object") {
    throw new Error("Weather response had no current conditions");
  }

  const current = response.current;
  const daily = response.daily ?? {};
  const precipChance = firstNumber(daily.precipitation_probability_max);

  return {
    temperatureF: finiteNumber(current.temperature_2m),
    weatherCode: finiteNumber(current.weather_code),
    feelsLikeF: finiteNumber(current.apparent_temperature),
    windMph: finiteNumber(current.wind_speed_10m),
    highF: firstNumber(daily.temperature_2m_max),
    lowF: firstNumber(daily.temperature_2m_min),
    peakPrecipChance: precipChance !== null && precipChance >= 0 && precipChance <= 100 ? precipChance : null,
    observedAt: typeof current.time === "string" ? current.time : "",
  };
}

function formatTemperature(value: number | null): string {
  return value === null ? "—" : `${Math.round(value)}°`;
}

function formatObservedAt(value: string): string {
  // Open-Meteo returns a Boulder wall-clock time because the request sets America/Denver.
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return "Weather time unavailable";
  const [, year, month, day, hour, minute] = match;
  const date = new Date(Date.UTC(+year, +month - 1, +day, +hour, +minute));
  if (Number.isNaN(date.getTime())) return "Weather time unavailable";
  const formatted = new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC",
  }).format(date);
  return `Conditions as of ${formatted} Boulder time`;
}

function coatAdvice(report: WeatherReport): string {
  const feelsLike = report.feelsLikeF ?? report.temperatureF;
  if (feelsLike === null) return "Check the conditions before you head out.";

  let advice: string;
  if (feelsLike <= 35) advice = "A warm coat is a good idea.";
  else if (feelsLike <= 55) advice = "Bring a coat.";
  else if (feelsLike <= 65 || (report.windMph !== null && report.windMph >= 15)) {
    advice = "A light layer should help.";
  } else advice = "You can probably skip the coat.";

  if (report.peakPrecipChance !== null && report.peakPrecipChance >= 50) {
    advice += " Plan for possible precipitation today.";
  }
  return advice;
}

function sameWeather(first: WeatherReport, second: WeatherReport): boolean {
  return first.temperatureF === second.temperatureF &&
    first.weatherCode === second.weatherCode &&
    first.feelsLikeF === second.feelsLikeF &&
    first.windMph === second.windMph &&
    first.highF === second.highF &&
    first.lowF === second.lowF &&
    first.peakPrecipChance === second.peakPrecipChance &&
    first.observedAt === second.observedAt;
}

function WeatherGlyph({ code }: { code: number | null }) {
  const storm = code === 95 || code === 96 || code === 99;
  const snow = code !== null && [71, 73, 75, 77, 85, 86].includes(code);
  const rain = code !== null && [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code);
  const fog = code === 45 || code === 48;
  const clear = code === 0;
  const partlyCloudy = code === 1 || code === 2;

  return (
    <svg viewBox="0 0 120 120" className="weather-glyph">
      {(clear || partlyCloudy) && (
        <g className="weather-glyph-sun">
          <circle cx="48" cy="45" r="19" />
          <path d="M48 12v9M48 69v9M15 45h9M72 45h9M25 22l7 7M64 62l7 7M25 68l7-7M64 29l7-7" />
        </g>
      )}
      {!clear && !fog && (
        <path className="weather-glyph-cloud" d="M30 81h57a17 17 0 0 0 0-34 25 25 0 0 0-47-7 19 19 0 0 0-10 41Z" />
      )}
      {fog && <g className="weather-glyph-detail"><path d="M21 46h72M13 61h68M30 76h75" /></g>}
      {rain && <g className="weather-glyph-detail"><path d="m42 91-4 10m23-10-4 10m23-10-4 10" /></g>}
      {snow && <g className="weather-glyph-detail"><path d="M40 91v11m-5-6h10m18-5v11m-5-6h10m18-5v11m-5-6h10" /></g>}
      {storm && <path className="weather-glyph-detail" d="m62 84-8 16h10l-5 15 22-23H69l7-8" />}
    </svg>
  );
}

type Status = "loading" | "loaded" | "error";
type Source = "live" | "sample";

export function WeatherCard() {
  const [status, setStatus] = useState<Status>("loading");
  const [source, setSource] = useState<Source>("live");
  const [weather, setWeather] = useState<WeatherReport | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [refreshError, setRefreshError] = useState(false);
  const [refreshResult, setRefreshResult] = useState<"unchanged" | "updated" | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setRefreshError(false);
    setRefreshResult(null);
    if (weather) setIsRefreshing(true);
    else setStatus("loading");

    fetch(WEATHER_URL, { signal: controller.signal, cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`Weather request failed: ${response.status}`);
        return response.json();
      })
      .then((json: unknown) => {
        if (controller.signal.aborted) return;
        const nextWeather = toWeatherReport(json);
        if (weather) {
          setRefreshResult(source === "live" && sameWeather(weather, nextWeather) ? "unchanged" : "updated");
        }
        setWeather(nextWeather);
        setLastUpdated(Date.now());
        setSource("live");
        setStatus("loaded");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.error(error);
        if (weather) setRefreshError(true);
        else setStatus("error");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsRefreshing(false);
      });

    return () => controller.abort();
    // Each attempt is an explicit request. The previous report stays visible if refresh fails.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  function refresh() {
    setAttempt((previous) => previous + 1);
  }

  function useSample() {
    setWeather(fallback.weather);
    setLastUpdated(null);
    setSource("sample");
    setStatus("loaded");
  }

  return (
    <section className="dashboard-card weather-card" aria-labelledby="weather-title">
      <div className="weather-heading">
        <div>
          <p className="eyebrow">Local weather · Boulder, Colorado</p>
          <h2 id="weather-title" className="card-title mt-2">Do I need a coat?</h2>
        </div>
        {status === "loaded" && (
          <button type="button" onClick={refresh} disabled={isRefreshing} className="secondary-button weather-refresh-button">
            {isRefreshing ? "Updating…" : "Refresh"}
          </button>
        )}
      </div>

      {status === "loading" && (
        <div className="weather-loading" role="status" aria-live="polite">
          <div className="weather-loading-art" aria-hidden="true" />
          <p className="supporting-text">Reading the Boulder forecast…</p>
        </div>
      )}

      {status === "loaded" && weather && (
        <>
          {source === "sample" && <p className="sample-badge mt-4">Sample data — not live</p>}
          <div className="weather-hero">
            <div className="weather-art" aria-hidden="true"><WeatherGlyph code={weather.weatherCode} /></div>
            <div>
              <p className="weather-value">{formatTemperature(weather.temperatureF)}{weather.temperatureF !== null && <span>F</span>}</p>
              <p className="weather-condition">
                {weather.weatherCode === null ? "Condition unavailable" : WEATHER_LABELS[weather.weatherCode] ?? `Weather code ${weather.weatherCode}`}
              </p>
              <p className="supporting-text weather-observed">{formatObservedAt(weather.observedAt)}</p>
            </div>
          </div>

          <div className="weather-advice">
            <p className="eyebrow">Field note</p>
            <p>{coatAdvice(weather)}</p>
          </div>

          <dl className="weather-report-grid">
            <div><dt>Feels like</dt><dd>{formatTemperature(weather.feelsLikeF)}{weather.feelsLikeF !== null && "F"}</dd></div>
            <div><dt>Today’s high / low</dt><dd>{formatTemperature(weather.highF)} / {formatTemperature(weather.lowF)}</dd></div>
            <div><dt>Wind now</dt><dd>{weather.windMph === null ? "—" : `${Math.round(weather.windMph)} mph`}</dd></div>
            <div><dt>Peak precip. chance</dt><dd>{weather.peakPrecipChance === null ? "—" : `${Math.round(weather.peakPrecipChance)}%`}</dd></div>
          </dl>

          {refreshError && (
            <p className="weather-refresh-error" role="alert">
              Couldn’t update the weather. Showing the previous report.
            </p>
          )}
          {refreshResult && (
            <p className="weather-refresh-note" role="status">
              {refreshResult === "unchanged"
                ? "Checked again. The forecast values are unchanged."
                : "Latest weather report loaded."}
            </p>
          )}
          {source === "live" && (
            <LastUpdated at={lastUpdated} label="Last checked" showSeconds className="mt-auto pt-4" />
          )}
        </>
      )}

      {status === "error" && (
        <div className="error-panel mt-4 text-sm" role="alert">
          <p>Couldn&apos;t reach the weather service.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={refresh} className="action-button">Try again</button>
            <button type="button" onClick={useSample} className="secondary-button">Show sample data</button>
          </div>
        </div>
      )}
    </section>
  );
}
