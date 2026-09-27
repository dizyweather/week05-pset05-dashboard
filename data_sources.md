# The data-source menu

Eighteen live data sources you can build cards from. Every one of them is **keyless**: no account, no
sign-up, no credit card, nothing secret to protect.

**Start by opening one in a browser tab.** Paste a URL from this page into your address bar and
press enter. What comes back is JSON, and it is the same thing your code will receive. Read it
before you write any fetch — that is the whole reason the checkpoint asks you to paste ten lines of
it.

**How to read one of these URLs.** Everything before the `?` is the endpoint. Everything after it is
a list of settings joined by `&`. In
`…/forecast?latitude=40.015&longitude=-105.2705&current=temperature_2m`, you are asking for one
place and one measurement. Change the numbers, reload the tab, and watch the answer change. That is
the fastest way to understand an API, and it costs nothing.

---

## These are somebody's gift

None of the services on this page had to exist.

A museum decided that its catalogue should be open to anyone who asks. A federal agency decided that
weather warnings belong to the public. A volunteer has kept a recipe database running for years for
no money. Somebody is paying for every request you make — in servers, in bandwidth, in their own
time — and they decided to let strangers like you have it for free, with no account and no
questions.

That generosity is fragile. Services close their doors when the traffic stops being worth it, and
the usual cause is not malice. It is a few thoughtless programs asking a thousand times an hour for
something they needed once.

So be a good guest. Four habits cover nearly all of it:

- **Fetch once per page load**, not once per render, and never on a timer you set and forget.
- **Do not build a refresh loop** while you are developing. If you need the same response twenty
  times, save it to a file and work from that.
- **If a service tells you to slow down, slow down.** A `429` response is a polite request, not an
  obstacle to route around.
- **Read what the service asks of you.** Most publish a page of terms in plain English. It usually
  takes two minutes and asks for very little.

**Watch your AI here in particular.** Ask an agent for "live data" and it will cheerfully write you
a `setInterval` that refetches every second, or a retry loop with no limit, and it will look
perfectly reasonable in the diff. That is thousands of requests a day to somebody else's server,
from code you did not really read. Reading what your agent wrote is a habit this course keeps asking
of you; this is the week where not reading it costs someone other than you.

## Do I need a coat?

<!-- probe: open-meteo-current -->
**Open-Meteo — conditions right now**
`https://api.open-meteo.com/v1/forecast?latitude=40.015&longitude=-105.2705&current=temperature_2m,weather_code&temperature_unit=fahrenheit`
Temperature and a weather code for one location. The code is a number, not a word — you turn it
into "Overcast" with a lookup table. **This is the source the starter card already uses**, so you
have a worked example of every step.

<!-- probe: open-meteo-daily -->
**Open-Meteo — sunrise, sunset, and UV**
`https://api.open-meteo.com/v1/forecast?latitude=40.015&longitude=-105.2705&daily=sunrise,sunset,uv_index_max&timezone=America%2FDenver&forecast_days=1`
Same service, different question. Note that the values arrive inside arrays, even when you ask for
one day — a shape worth practicing on.

<!-- probe: open-meteo-air -->
**Open-Meteo — air quality**
`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=40.015&longitude=-105.2705&current=us_aqi`
One number, the US air-quality index. The simplest response on this page.

<!-- probe: nws-alerts -->
**National Weather Service — active Colorado alerts**
`https://api.weather.gov/alerts/active?area=CO`
Every active weather alert in the state. Often an empty list, which makes it a good card for
practising the "nothing to show" case — that is not an error, and it should not look like one.

---

## What is happening that I should know about?

<!-- probe: usgs-quakes -->
**USGS — earthquakes in the past day**
`https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson`
A few hundred events worldwide, newest first. Deeply nested: each event keeps its numbers under
`properties`. Good practice at digging.

<!-- probe: wikimedia-onthisday -->
**Wikipedia — on this day**
`https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/selected/09/17`
Historical events for one date. The month and day sit in the URL itself — `09/17` is September 17 —
so building today's URL in code is part of the job.

<!-- probe: spaceflight-news -->
**Spaceflight News — recent articles**
`https://api.spaceflightnewsapi.net/v4/articles/?limit=5`
Headlines, summaries, and links. **This one rate-limits**: ask too often and it answers 429 for a
while. Fetch once per page load, not once per keystroke.

<!-- probe: nager-holidays -->
**Public holidays**
`https://date.nager.at/api/v3/PublicHolidays/2026/US`
Every US public holiday for the year, as a plain array. A countdown to the next one is a nice card.

<!-- probe: jolpica-f1 -->
**Formula 1 — the last race**
`https://api.jolpi.ca/ergast/f1/current/last/results.json`
Finishing order, times, and constructors for the most recent Grand Prix. Deeply nested — the results
sit several levels down inside `MRData` — so it is good practice at following a path. **Treat this
one gently:** it is volunteer-run, it asks for no more than four requests a second and 500 an hour,
and its documentation asks you to cache what you fetch rather than re-ask.

<!-- probe: openligadb -->
**Bundesliga — German men's football**
`https://api.openligadb.de/getmatchdata/bl1`
Fixtures and results for the current matchday, as a plain array. OpenLigaDB is a community project in
the most literal sense: volunteers type in the results, the data is published under an open licence,
and the members pay the server bill themselves — about fifty euros a month.

<!-- probe: openligadb-frauen -->
**Frauen-Bundesliga — German women's football**
`https://api.openligadb.de/getmatchdata/ffb1`
The same project, the women's top flight. Identical response shape to the entry above, which makes
the pair a neat experiment: write one card, then point it at the other league and watch it keep
working. That is what "same API, different endpoint" means in practice.

---

## One thing to make the next ten minutes better

<!-- probe: artic -->
**Art Institute of Chicago**
`https://api.artic.edu/api/v1/artworks?limit=5&fields=id,title,artist_title,image_id`
Artworks with titles and artists. To show the picture you build an image URL out of the `image_id`
you get back — the response tells you how in its `config` section.

<!-- probe: met-museum -->
**The Met**
`https://collectionapi.metmuseum.org/public/collection/v1/objects/45734`
One object, with a title, an artist, a date, and an image link. Change the number at the end for a
different object.

<!-- probe: open-library -->
**Open Library — book search**
`https://openlibrary.org/search.json?q=dune&limit=5`
Search results for any query. Swap `dune` for anything.

<!-- probe: tvmaze -->
**TVmaze — what is on today**
`https://api.tvmaze.com/schedule?country=US&date=2026-09-17`
A day of US television. The date is in the URL, so today's schedule means building today's URL.

<!-- probe: themealdb -->
**TheMealDB — a random recipe**
`https://www.themealdb.com/api/json/v1/1/random.php`
One meal, with ingredients and instructions. A new one every time you reload.

<!-- probe: frankfurter -->
**Frankfurter — currency rates**
`https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR,JPY`
Exchange rates against any base currency. Small, flat, and easy to read.

<!-- probe: colorado-open-data -->
**Colorado open data**
`https://data.colorado.gov/resource/4ykn-tg5h.json?$limit=5`
One of the state's public datasets. The catalogue at `data.colorado.gov` has hundreds more, and they
all answer in the same shape — if you find one you like better, it counts as a different source and
needs permission first (see below).

---

## Using something that is not on this list

You may. Ask first — **in office hours or by email** — and say which URL you want to use. That is
the whole process, and the answer is usually yes.

Ask before you build, not after. Staff check four things, and you can check them yourself in about a
minute:

1. **Free, with no payment card**, and no account to create.
2. **HTTPS**, not plain `http://` — a browser blocks the insecure kind on a secure page.
3. **It returns JSON**, not a web page.
4. **It loads in a plain browser tab** and your own page is allowed to read it.

That fourth one is the one that surprises people, and it is worth understanding rather than just
obeying. A server decides which websites may read its answers. If it does not say your page is
welcome, your fetch fails even though the same URL looks perfect in a browser tab. Nothing is wrong
with your code. The source simply is not open to you.

**A source that requires a key is a separate conversation.** This assignment ships nothing to keep a
secret in, and a key pasted into browser code is visible to anyone who opens developer tools. If the
source you want needs one, raise it when you ask.

---

## Checked, and kept off the menu

These were tested with the rest. They are here so you do not lose an evening to one — and so you can
see that judging a source is part of the work, not a detour from it.

| Source | What happens |
|---|---|
| xkcd, ZenQuotes | Answer perfectly in a browser tab, but refuse to let your page read them |
| Reddit's `.json` URLs | Refuse unauthenticated requests outright |
| REST Countries | Works, but bounces you to an old file server — a sign the service has moved on |
| `api.frankfurter.app` | The old address. Use the `frankfurter.dev` one above |
| GDELT | Unreliable under repeated requests |
| Open Notify (ISS position) | `http://` only, so a secure page cannot load it |
| ESPN's scoreboard URLs | Work beautifully, and are nobody's published API — undocumented internals, no terms to read, no permission given. "It works" and "you may use it" are different questions |
| MLB's stats endpoint | Answers, and its own response asserts copyright terms over an endpoint that was never published for outside use |
| TheSportsDB | Looks keyless, but the `3` in its URL is a shared key — send a different one and it tells you to go and buy a subscription |
| The NHL | Publishes real JSON and sends no CORS header with it — a script can read it, your page cannot |
| MLS | Its own `sportapi.mlssoccer.com` still answers, but every public path now returns 404. Only ESPN has it |

**On the missing sports.** No US league publishes free, keyless data that a web page can read — not
the NFL, MLB, NBA, NHL MLS, WNBA, NWSL or PWHL. They refuse in three different ways,
and the differences are worth knowing, because you will meet all three again:

- **"Not for your page."** The NHL publishes real JSON at `api-web.nhle.com` — schedules, teams,
  standings — and sends no CORS header with it. A script can read it. A web page cannot. The data is
  public; permission for your app is not.
- **"Through the back door only."** The NFL, MLB, NBA, WNBA and MLS are reachable through ESPN's
  undocumented internal URLs and almost nowhere else. MLS used to publish its own endpoints at
  `sportapi.mlssoccer.com`; that host still answers, but the paths now return 404.
- **"Not at all."** The NWSL has no public feed. The PWHL's is key-gated and unreadable from a
  browser.

This is not an accident. Leagues treat their statistics as an asset and sell access to them, and the
youngest leagues — which is to say most of the women's ones — have had the least opportunity to give
anything away for free before the data became worth money.

What is open tends to be volunteer-run instead, which is why both sports entries above come from
small community projects rather than from a league. It is worth noticing generally: what is open is
usually open because a person decided it should be, not because nobody could charge for it.
