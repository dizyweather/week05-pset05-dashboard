# pset05-dashboard: Morning Briefing Dashboard

**Assignment ID:** `pset05-dashboard` · **Launched:** Monday of Week 5 · **Checkpoint due:** Friday of Week 5 · **Due:** Wednesday of Week 6 · **Submit with:** a push to your private GitHub repo, then the repo link on Canvas

So far your apps have only known what you typed into them. This week your app reaches out into the world: you'll build a **Morning Briefing Dashboard** — a one-screen page of cards showing live information (weather, headlines, a work of art, whatever briefing *you'd* want) fetched from at least one real data source over the network.

This is also the week you learn the habit that separates hobby code from real software: **handling failure on purpose**. Networks fail. Services go down. Fields go missing. Your app has to say so, kindly, instead of showing a blank screen or a spinner that never stops.

> **Expect 4–6 hours.** Rough split: first card end-to-end ~2 hr, each additional card ~1 hr,
> evidence capture ~45 min. That last number surprises people — screenshotting a loading state and
> an error state takes time, so don't leave it for the last minute.

## Smallest passing submission

**One** live-data card with all three faces (loading, loaded, failed), a complete field map for it,
and a live prompt log. Add more cards only after that exists, and scale back
back to it if the week gets away from you.

## The 7:55 a.m. test

Before you pick your cards, pick your *reason*. Your dashboard should answer three questions you have in the ten minutes before your first class:

- **Do I need a coat?**
- **What is happening in the world that I should know about?**
- **One thing that will make the next ten minutes better** — a work of art, a recipe, a countdown to
  something you care about.

Write your three questions at the top of your `json_field_map.md`.

---

## Checkpoint — due Friday of Week 5

**A separate Canvas item, worth 10 of this assignment's 100 points.** Five short answers, typed into
the Canvas text box. No code, no repo, no screenshots.

1. **Your three questions** — your 7:55 a.m. test, from above.
- Where are earthquakes happening?
- What happened on this day in the past?
- What's an art piece that was sold today?
2. **The endpoint URL you picked** from `data_sources.md`.
- **USGS — earthquakes in the past day**
`https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson`
3. **The first ten lines of the JSON** that URL gave you. Open it in a browser tab, copy, paste.
- {"type":"FeatureCollection","metadata":{"generated":1790370386000,"url":"https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson","title":"USGS All Earthquakes, Past Day","status":200,"api":"2.7.0","count":207},"features":[{"type":"Feature","properties":{"mag":0.68,"place":"11 km WNW of The Geysers, CA","time":1790370275470,"updated":1790370370079,"tz":null,"url":"https://earthquake.usgs.gov/earthquakes/eventpage/nc75441952","detail":"https://earthquake.usgs.gov/earthquakes/feed/v1.0/detail/nc75441952.geojson","felt":null,"cdi":null,"mmi":null,"alert":null,"status":"automatic","tsunami":0,"sig":7,"net":"nc","code":"75441952","ids":",nc75441952,","sources":",nc,","types":",nearby-cities,origin,phase-data,","nst":12,"dmin":0.009432,"rms":0.02,"gap":117,"magType":"md","type":"earthquake","title":"M 0.7 - 11 km WNW of The Geysers, CA"},"geometry":{"type":"Point","coordinates":[-122.868835449219,38.8288345336914,2.22000002861023]},"id":"nc75441952"},

4. **One sentence** on what your card will show when that request fails.
- It will show a image of the earth with a crack through it.
5. **Being a good guest.** Read "These are somebody's gift" in `data_sources.md` first. Then, in a
   few sentences: who runs the source you picked, and what will you do to keep your app from being a
   burden on it? Name one thing you will watch for in the code your AI writes.
   - The National Earthquake Information Center (NEIC), which is a part of the U.S. Geological Survey (USGS) under the U.S. Department of the Interior, runs the source.
   - to prevent being a burden, i'd only load the data once and store in local memory. If local doesn't have memory for the day only then fetch again.

This is due at the start of lab on Friday.

---

## Vocabulary for this week

- **API (Application Programming Interface):** a contract that lets one program request data from another. You send a request to a URL; a server sends back structured data.
- **JSON:** the near-universal text format that data comes back in — nested labeled values like `{"temp": 54, "condition": "cloudy"}`. Your job is mapping its fields onto your UI.
- **Endpoint:** one specific URL you can request, e.g. `https://api.open-meteo.com/v1/forecast`. One API usually offers several endpoints.
- **Fetch:** the browser feature your code uses to make a request. Fetching takes time, which is why…
- **Loading state:** what your app shows *while waiting* for data ("Loading weather…"), and **error state:** what it shows when the request *fails* ("Couldn't load weather — retry?"). Both are required this week, for every data source.
- **Repo, dev server, state, event handler:** as in Weeks 3–4.

---

## Part 0 — Setup

Your `pset05-dashboard` starter is a zip on Canvas. Unzip it into your course folder, beside the last two assignments — the folder is already a Git repo with one "starter" commit, same as the last two weeks. **New this week: publish it to GitHub before you build.** Open the folder in VS Code, open the Source Control view, and click **Publish to GitHub** — choose **private**. One click, once per assignment; from now on every commit you make can be pushed there, and that repo is what you submit. (The Canvas guide "Getting on GitHub" covers the account and the sign-in.)

Then the **bench check** — your all-green before you start: `node --version` prints `v22` or newer, VS Code has the folder open, and Codex, attached to the folder, answers a message.

```
node --version     # v22 or newer
npm install
npm run dev
```

Confirm the standard files: `README.md`, `data_sources.md`, `json_field_map.md`, `prompt_log.md`, `src/App.tsx`, `package.json`, `.gitignore`.

## Choosing your data sources

**`data_sources.md`, in this folder, is the menu.** Eighteen sources, grouped by the three questions
above, every one of them checked by staff and every one of them **keyless** — no account, no
sign-up, nothing secret to keep. `WeatherCard` in `src/App.tsx` is already wired to the first one
end to end, so you have a worked example in front of you.

**Read "These are somebody's gift" in that file before you pick.** Every source on the menu is free
because a museum, an agency, or a volunteer decided to give it away, and none of them had to.
Treating that well — asking once rather than a thousand times — is part of this assignment, and the
Friday checkpoint asks you about it.

**Anything not on that list needs permission first** — ask in office hours or by email, before you
build. The menu explains what staff check for, and you can check it yourself in a minute. 

**Requirements:** fetch from **at least one** live network data source. A strong dashboard typically
shows 2–3 cards, but see "Smallest passing submission" above: one card done thoroughly beats three
done thinly.

A note on secrets, since you will meet this soon. Some APIs hand out a key — a password-like string
that identifies who is asking. A key pasted into browser code is **visible to anyone who opens
developer tools**, no matter how cleverly it is hidden, which is why every source on this week's
menu needs none. You will build apps that hold keys later in this course, and you will learn where
they actually belong. This week, the correct number of secrets in your project is zero.

---

## Part 1 — Build it

**Plan-before-patch still applies** (this week and next are its last required weeks): ask Codex for the plan first — end the message with **"Plan only — do not change any files yet."** — read it, and only then say **"Go ahead with the plan."** Nothing enforces this but you and your log. One card per loop, each logged by hand in `prompt_log.md` and then committed in Source Control with the Intent line as the message. Keep the Week 4 habit: minimal, single-purpose prompts.

A build order that works:

1. **One card, hardcoded.** Lay out a weather card with fake data. No network yet.
2. **Wire the fetch.** Replace fake data with a real fetch from your chosen endpoint. Look at the raw JSON first — you already did this for the checkpoint — *before* mapping it to the card. Start your **JSON field map** now (`json_field_map.md`): every field you display gets a row — endpoint, JSON path, example value, which UI element shows it, and what the card does if the field is missing.
3. **Add loading and error states.** Every card must have all three faces: loading, loaded, failed. You must *see* the error state to prove it: disconnect from the network, or temporarily break the endpoint URL (misspell `forecast` as `forecats`), reload, screenshot the friendly error as `error.png`, fix the URL back. Same trick for loading: open dev tools → Network tab, throttle the connection, reload, and screenshot the loading face as `loading.png`. Screenshot the working dashboard as `dashboard.png`. All three go in the `screenshots/` folder, which explains itself in `what_goes_here.md`. *(Throttling instructions here assume Chrome or Edge, where the control is a dropdown in the Network tab reading "No throttling" → "Slow 3G." Firefox and Safari both have an equivalent; ask staff or search "throttle network" plus your browser name.)* These screenshots are deliverables.
4. **Check the reload.** Load the page fresh several times in a row. Cards should refetch cleanly every time — no flash of stale data, no card stuck on "Loading…", no doubled requests.
5. **More cards.** Repeat per source. Each new source: fetch → field map rows → three faces → evidence.

Missing fields are normal: decide the fallback for every field (show "—", hide the element, use a default) and write it in the field map's fallback column.

**The starter's sample data is deliberately opt-in.** Look at how `WeatherCard` handles a failure: it does *not* quietly fill the card with the bundled sample. It shows the error, and offers the sample behind a button that labels it as sample data on screen. Canned data shown without saying so is a lie, and it is the most common way a dashboard misleads the person reading it.

---

## Part 2 — Submit

```
npm run build      # silence or ✓ means pass
npm run lint
```

Then, in order: the deliverables list below, **Commit** in Source Control, and **push** (Source Control → **Sync**). Paste your repo link into the Canvas assignment. The repo's state at the deadline is what's graded — push early and often; the last pushed commit before the deadline counts, and nothing checks the push for you.

## Deliverables checklist

The checkpoint is its own Canvas item, due Friday of Week 5. Everything else lives inside the repo at submit time:

- [ ] Working dashboard fetching ≥1 live network data source, running with `npm run dev`
- [ ] Loading state AND error state visibly implemented for every fetched source
- [ ] `json_field_map.md` with a row for every JSON field displayed in the UI
- [ ] `screenshots/` holding `dashboard.png`, `loading.png`, and `error.png` — your three faces
- [ ] `prompt_log.md` with an entry per AI interaction
- [ ] Repo link submitted on Canvas; your last pushed commit before the deadline

## Rubric summary

ⓐ dimensions feed the semester audit-log grade.

| Dimension | Weight |
|---|---|
| Checkpoint — source pick | 10% |
| API/data integration | 30% |
| JSON mapping | 20% |
| Loading/error handling | 20% |
| Usable display | 10% |
| Prompt log quality ⓐ | 10% |

## Above and beyond (extra credit)

Work that qualifies:

- **A second source with a differently shaped payload:** a source whose JSON nests differently from your first — an array of items instead of a single object, say — with its mapping fully documented in the field map.
- **Graceful offline behavior:** cache the last good data and show it with a "stale as of 7:42 a.m." stamp when the network fails — a fourth face of a card, and an honest one.

Any of these — or something we didn't think of — can earn extra credit. One rule: add a clearly marked **"Above and beyond"** note to your submission saying what you did, why it goes beyond the brief, and how you verified it. Undescribed extra work earns nothing — this course grades what it can audit. And extra work never substitutes for a required deliverable: a missing deliverable plus a stretch feature is still a missing deliverable.

## AI use

**AI use is required; unverified submission is not allowed.** The agent will happily write your fetch code — your job is to know what it wrote: which endpoint, which JSON fields, and what happens when the network fails. Every AI interaction that shaped the work gets a `prompt_log.md` entry.

One thing to check every time this week: **how often does this code call out to the internet?** An agent asked for live data will reach for a timer that refetches every few seconds, or a retry loop with no limit, and the diff looks innocent. Those requests land on a free service that somebody else pays for. Unread AI code is how a class of thirty becomes a traffic problem for a volunteer-run API.

## Troubleshooting / FAQ

**Anything environmental acting up.** The bench check first: `node --version` prints `v22` or newer, VS Code opens the folder, and Codex attached to the folder answers a message. Whichever step fails is the thing to fix; say which one in any help request, and paste the exact error.

**My fetch returns an error or nothing at all.** Evidence first, debugging loop second (you learned it last week): open dev tools → Network tab, find the request, look at its status and response. URL typo? Endpoint down (does it load in a plain browser tab)? Then ask Codex: "my fetch to <your endpoint> returns <status/error> — what are likely causes? Explain only — do not change any files."

**The URL works in a browser tab but my fetch fails, and the console says something about CORS.** Your code is fine. A server chooses which websites may read its answers, and that one has not said yes to your page. There is no trick that gets around it from browser code. Switch to a source on the menu — every one of them was checked for exactly this.

**The data shows up but my card displays `undefined`.** Your JSON path doesn't match reality. Log the raw response to the console and read the actual structure — the field you want may be nested somewhere else (`current.temperature_2m`, not `current.temp`). This is precisely what the field map exists to catch.

**The page shows the error state forever even though the endpoint works.** Classic stale-state or swallowed-error bug — check whether your fetch code ever *clears* the error and *sets* the data. Nice Week 4-style transcript material, incidentally.

**The source I want isn't on the menu.** Ask, in office hours or by email, before you build it. Say which URL you want. The four things staff check are listed in `data_sources.md`, and you can check them yourself first.

**I'm getting a 429.** That is a rate limit: you are asking too fast, usually because the fetch sits inside a render loop instead of running once per page load. Fix the loop, then wait a few minutes before trying again.

**My repo is a tangle and I want to start clean.** Try the **discard rescue** first: Source Control → **Discard All Changes** returns the folder to your last commit, which is your last verified loop. Worst case, the **fresh-clone rescue**: clone a fresh copy of your own repo from GitHub (VS Code → Source Control → Clone Repository; the Canvas guide "Getting on GitHub" shows it), copy in just the files you changed since your last push (`src/App.tsx` plus your markdown deliverables), then `npm install` and `npm run dev`.
