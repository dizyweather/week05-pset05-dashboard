import { useCallback, useEffect, useRef, useState } from "react";
import { LastUpdated } from "./LastUpdated";

const ON_THIS_DAY_URL = "https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/selected";

type Status = "loading" | "loaded" | "error";

interface HistoricalEvent {
  year: number;
  text: string;
  url: string | null;
}

function calendarDay() {
  const now = new Date();
  return {
    month: String(now.getMonth() + 1).padStart(2, "0"),
    day: String(now.getDate()).padStart(2, "0"),
    label: new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric" }).format(now),
  };
}

function wikipediaUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "en.wikipedia.org" ? url.href : null;
  } catch {
    return null;
  }
}

function parseEvents(json: unknown): HistoricalEvent[] {
  if (!json || typeof json !== "object" || !("selected" in json)) {
    throw new Error("On This Day response has no selected events");
  }
  const selected = (json as { selected: unknown }).selected;
  if (!Array.isArray(selected)) throw new Error("On This Day events are not an array");

  return selected.flatMap((raw): HistoricalEvent[] => {
    if (!raw || typeof raw !== "object") return [];
    const item = raw as Record<string, unknown>;
    if (typeof item.year !== "number" || !Number.isInteger(item.year) ||
      typeof item.text !== "string" || !item.text.trim()) return [];

    const pages = Array.isArray(item.pages) ? item.pages : [];
    const url = pages.map((page) => {
      if (!page || typeof page !== "object") return null;
      const links = (page as { content_urls?: { desktop?: { page?: unknown } } }).content_urls;
      return wikipediaUrl(links?.desktop?.page);
    }).find((link) => link !== null) ?? null;

    return [{ year: item.year, text: item.text.trim(), url }];
  });
}

function displayYear(year: number): string {
  return year < 0 ? `${Math.abs(year)} BCE` : String(year);
}

export function OnThisDayCard() {
  const [date, setDate] = useState(calendarDay);
  const [status, setStatus] = useState<Status>("loading");
  const [events, setEvents] = useState<HistoricalEvent[]>([]);
  const [index, setIndex] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const today = calendarDay();
    setDate(today);
    setStatus("loading");
    setEvents([]);
    setIndex(0);
    setLastUpdated(null);

    fetch(`${ON_THIS_DAY_URL}/${today.month}/${today.day}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Wikimedia request failed: ${response.status}`);
        return response.json();
      })
      .then((json: unknown) => {
        if (controller.signal.aborted) return;
        setEvents(parseEvents(json));
        setLastUpdated(Date.now());
        setStatus("loaded");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.error(error);
        setStatus("error");
      });

    return () => controller.abort();
  }, [attempt]);

  const move = useCallback((step: number) => {
    setIndex((previous) => events.length === 0 ? 0 : (previous + step + events.length) % events.length);
  }, [events.length]);

  const current = events[index] ?? null;

  return (
    <section className="dashboard-card on-this-day-card" aria-labelledby="on-this-day-title">
      <div className="newspaper-masthead">
        <h2 id="on-this-day-title" className="card-title">On This Day</h2>
        <p className="newspaper-dateline">{date.label} · Historical notes</p>
      </div>
      <div className="newspaper-rule" aria-hidden="true" />

      {status === "loading" && (
        <p className="supporting-text mt-3" role="status">Opening the archives…</p>
      )}

      {status === "error" && (
        <div className="error-panel mt-3 text-sm" role="alert">
          <p>Couldn&apos;t load today&apos;s historical events.</p>
          <button type="button" className="action-button mt-3"
            onClick={() => setAttempt((previous) => previous + 1)}>Try again</button>
        </div>
      )}

      {status === "loaded" && events.length === 0 && (
        <p className="supporting-text mt-3" role="status">No selected events are available for {date.label}.</p>
      )}

      {status === "loaded" && current && (
        <div className="newspaper-story" aria-live="polite"
          onTouchStart={(event) => {
            const touch = event.touches[0];
            touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
          }}
          onTouchEnd={(event) => {
            const start = touchStart.current;
            const touch = event.changedTouches[0];
            touchStart.current = null;
            if (!start || !touch) return;
            const dx = touch.clientX - start.x;
            const dy = touch.clientY - start.y;
            if (Math.abs(dx) >= 55 && Math.abs(dx) > Math.abs(dy) * 1.5) {
              move(dx < 0 ? 1 : -1);
            }
          }}>
          <p className="newspaper-kicker">From the archives</p>
          <p className="newspaper-year">{displayYear(current.year)}</p>
          <p className="newspaper-copy">{current.text}</p>
          {current.url && (
            <a className="text-link newspaper-source" href={current.url}
              target="_blank" rel="noopener noreferrer">Read on Wikipedia</a>
          )}
        </div>
      )}

      {status === "loaded" && events.length > 0 && (
        <div className="newspaper-navigation">
          <button type="button" className="secondary-button" onClick={() => move(-1)}
            disabled={events.length < 2}>← Previous</button>
          <span className="newspaper-count" aria-live="polite">{index + 1} of {events.length}</span>
          <button type="button" className="secondary-button" onClick={() => move(1)}
            disabled={events.length < 2}>Next →</button>
        </div>
      )}

      <LastUpdated at={lastUpdated} className="mt-auto pt-3" />
    </section>
  );
}
