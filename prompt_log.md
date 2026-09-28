# Prompt Log — pset05-dashboard

One entry per AI interaction that shaped your work (every plan-only → go-ahead loop with Codex, any "Explain only" question or ChatGPT answer that changed what you did). Copy the blank entry and type it in by hand as you go, then Commit in Source Control with the Intent line as the message. Newest at the bottom. This week, verification entries should include the failure faces: "verified" means you saw the card load, saw it loaded, and *made it fail on purpose* at least once.

---

## Entry format

### Entry N — <short title> — <date/time>

- **Intent:** What you wanted to happen before touching the AI. One card, one fetch, one state — per entry.
- **AI/model/tool used:** Which tool and mode — Codex (ChatGPT app): plan only / go ahead / explain only, or ChatGPT chat — and the model, if it told you.
- **Output or changed files:** What came back — plan summary, files touched (list paths), or the answer.
- **Verification performed:** What you actually checked — preview, console, Network tab, induced failure, `npm run build` and `npm run lint` result. Include the *negative* checks (error face reachable, no card left stuck on "Loading…").
- **Iteration or remaining issue:** What you changed or would change next — follow-up prompt, manual fix, or "accepted as-is because …".

---

## Example (filled)

### Entry 4 — Wire weather card to the Open-Meteo forecast endpoint — 2026-09-22 09:40

- **Intent:** Replace the hardcoded weather card data with a real fetch from the Open-Meteo forecast endpoint, keeping the loading/error scaffolding from entry 3 intact.
- **AI/model/tool used:** Codex (ChatGPT app), attached to the project folder — plan only, then go ahead. The message pasted the actual JSON I saw at the endpoint so Codex mapped real field names instead of guessing.
- **Output or changed files:** Plan: add a `fetchWeather` function called on page load, store the response in the `weather` state, keep loading/error states. Said "Go ahead with the plan." Codex's report and the Source Control diff touched `src/App.tsx` only.
- **Verification performed:** Card showed real temp and condition matching the endpoint opened in a browser tab. Network tab: one request to the forecast endpoint, and only one. Induced failure by misspelling `forecast` in the URL — error face appeared ("Couldn't load weather"), other cards unaffected; screenshot saved as `screenshots/error.png`; fixed URL back. `npm run build` and `npm run lint` passed; committed as "Wire weather card to the Open-Meteo forecast endpoint".
- **Iteration or remaining issue:** The AI guessed the field as `temp` but the real path is `current.temperature_2m` — its first draft rendered `undefined`. Corrected by re-prompting with the pasted JSON (lesson: always paste the real response). Added both fields to `json_field_map.md`.

---

## Entries

### Entry 1 — Earthquake globe — 2026-09-27

- **Intent:** Show recent earthquakes in an interactive globe card.
- **AI/model/tool used:** Codex in the desktop app.
- **Output or changed files:** Asked to make a card of today's earthquake as a rotatable globe. `src/EarthquakeCard.tsx`, globe styling, and USGS rows in `json_field_map.md`. 
- **Verification performed:** Captured loaded, loading, and error screenshots in `screenshots/`.
- **Iteration or remaining issue:** Refined the Field Notes colors, cracked-globe error art, and eased rotation to selected points. No remaining issues.

### Entry 2 — On This Day newspaper card — 2026-09-27

- **Intent:** Add historical events in a newspaper-style card.
- **AI/model/tool used:** Codex in the desktop app.
- **Output or changed files:** Asked to make a card to show events that happened on this day in the past. `src/OnThisDayCard.tsx`, newspaper styling, and Wikimedia rows in `json_field_map.md`.
- **Verification performed:** Captured loading and error screenshots; checked the card in the dashboard layout.
- **Iteration or remaining issue:** Added carousel controls and the historical event source link. Asked gpt on formating options and it generated previews which was cool. No remaining issues.

### Entry 3 — Complete the Boulder weather report — 2026-09-27

- **Intent:** Make the weather card useful for deciding what to wear.
- **AI/model/tool used:** Codex in the desktop app.
- **Output or changed files:** Asked to help finish the weather card. `src/WeatherCard.tsx`, weather styling, sample data, field map, and screenshots. Changed from initial idea since artwork purchases need api keys.
- **Verification performed:** Checked live data, refresh, failed refresh, mobile and desktop layout, loading and error views; build and type check passed.
- **Iteration or remaining issue:** Renamed rain chance to precipitation chance to match the API. No remaining issues.
