import { EarthquakeCard } from "./EarthquakeCard";
import { OnThisDayCard } from "./OnThisDayCard";
import { WeatherCard } from "./WeatherCard";

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
