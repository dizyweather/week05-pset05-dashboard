# JSON Field Map — pset05-dashboard

3 Questions:
- Do I need to pack anything specific when going outside? E.g. rain, snow, high winds, sunny.
- Where are earthquakes happening in the past 24 hours?
- A new art piece bought today, maybe guess price for the fun of it?

Add **one row for every JSON field your dashboard displays** — if it's on screen, it's in this table. Build the map *while* you wire each card, from the real response (open the endpoint in a browser tab or log it to the console), not from memory.

How to write a **JSON path**: dot notation from the top of the response, with `[0]` for "first item of a list." If the response is `{"articles": [{"title": "…"}]}`, the first headline's path is `articles[0].title`.

The **fallback** column is a decision, not a shrug: what does your UI deliberately do when this field is missing, empty, or the fetch fails? ("Show '—'", "hide the wind row", "show card error face" are decisions. Blank is not.)

## Weather card

Examples below come from the Open-Meteo response opened on September 27, 2026.

| Endpoint | JSON path | Example value (from a real response) | UI element that shows it | Fallback when missing |
|---|---|---|---|---|
| Open-Meteo `/v1/forecast` | `current.temperature_2m` | `83.5` | Large temperature | Show `--°F` |
| Open-Meteo `/v1/forecast` | `current.weather_code` | `3` | Condition under temperature | Show “Condition unavailable” |
| Open-Meteo `/v1/forecast` | `current.time` | `"2026-09-27T21:15"` | Observed time | Show “Observation time unavailable” |

## Earthquake card

Examples below come from the USGS past-day feed opened on September 27, 2026. The example event is `hv75044317`.

| Endpoint | JSON path | Example value (from a real response) | UI element that shows it | Fallback when missing |
|---|---|---|---|---|
| USGS `/summary/all_day.geojson` | `features` | Array of 197 events | Total in the event selector | Show 0 and the empty state when the array is empty; show the error state if it is missing |
| USGS `/summary/all_day.geojson` | `features[0].geometry.coordinates[0]` | `-155.376831054688` | Red point longitude and globe rotation | Skip the event if missing or outside −180…180 |
| USGS `/summary/all_day.geojson` | `features[0].geometry.coordinates[1]` | `19.1523342132568` | Red point latitude and globe rotation | Skip the event if missing or outside −90…90 |
| USGS `/summary/all_day.geojson` | `features[0].geometry.coordinates[2]` | `27.6700000762939` | Depth in selected event panel | Show “Depth unavailable” |
| USGS `/summary/all_day.geojson` | `features[0].properties.mag` | `1.85` | Point size, selector, and magnitude in details | Use a small point and show “Magnitude unavailable” |
| USGS `/summary/all_day.geojson` | `features[0].properties.place` | `"12 km ESE of Pāhala, Hawaii"` | Selector and event location | Show “Location unavailable” |
| USGS `/summary/all_day.geojson` | `features[0].properties.time` | `1790541595600` | Event time, formatted in the viewer’s time zone | Show “Time unavailable” |
| USGS `/summary/all_day.geojson` | `features[0].properties.url` | `"https://earthquake.usgs.gov/earthquakes/eventpage/hv75044317"` | “View event on USGS” link | Hide the link if missing or invalid |

## Checks before you submit

- [ ] Every field visible in the UI has a row (spot-check your own screen against this table)
- [ ] Example values were copied from a real response, not invented
- [ ] Every fallback describes what the app *actually does* — test at least one by deleting/renaming the field in a hardcoded copy or breaking the fetch
- [ ] Paths match your code's property accesses exactly
