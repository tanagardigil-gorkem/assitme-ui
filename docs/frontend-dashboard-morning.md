# Frontend Spec: My Day (Dashboard Morning)

This spec describes how the frontend should query the Morning Dashboard endpoint and render the returned values into the existing **My Day** UI slots.

## Endpoint

- Method: `GET`
- Path: `/api/v1/dashboard/morning`
- Content-Type: `application/json` (response)

## Query Parameters

All parameters are sent as URL query params.

- `lat` (required, number)
  - Range: `-90` to `90`
  - Example: `37.7749`
- `lon` (required, number)
  - Range: `-180` to `180`
  - Example: `-122.4194`
- `timezone` (required, string)
  - Length: `1` to `64`
  - Use an IANA TZ identifier.
  - Example: `America/Los_Angeles`
- `limit` (optional, integer)
  - Default: `10`
  - Range: `1` to `50`
  - Meaning: max number of news items returned.
- `q` (optional, string)
  - Length: `1` to `120`
  - Meaning: optional keyword filter for news.

Example URL:

```text
/api/v1/dashboard/morning?lat=37.7749&lon=-122.4194&timezone=America%2FLos_Angeles&limit=10&q=ai
```

## Response Shape

Success response is `200 OK` with JSON shaped as `DashboardMorningResponse`.

Datetimes are ISO 8601 strings (parseable by `new Date(...)`).

### TypeScript Types

```ts
export type DashboardMorningResponse = {
  generated_at: string; // ISO 8601
  weather: WeatherCurrentResponse;
  news: NewsItem[];
  mood: MoodBlock;
};

export type MoodBlock = {
  affirmation: string;
  focus_prompt: string;
};

export type WeatherCurrentResponse = {
  location: WeatherLocation;
  current: WeatherCurrent;
  generated_at: string; // ISO 8601
};

export type WeatherLocation = {
  lat: number;
  lon: number;
  timezone: string;
};

export type WeatherCurrent = {
  temp_c: number;
  feels_like_c: number | null;
  wind_kph: number | null;
  precipitation_mm: number | null;
  condition_code: number | null;
  condition_text: string | null;
};

export type NewsItem = {
  headline: string;
  url: string;
  source: string;
  published_at: string | null; // ISO 8601 or null
  summary: string | null;
};
```

### Example JSON

```json
{
  "generated_at": "2026-02-02T19:07:21.123456+00:00",
  "weather": {
    "location": {
      "lat": 37.7749,
      "lon": -122.4194,
      "timezone": "America/Los_Angeles"
    },
    "current": {
      "temp_c": 12.3,
      "feels_like_c": 11.0,
      "wind_kph": 18.4,
      "precipitation_mm": 0.0,
      "condition_code": 3,
      "condition_text": "Partly cloudy"
    },
    "generated_at": "2026-02-02T19:07:20.987654+00:00"
  },
  "news": [
    {
      "headline": "Example headline",
      "url": "https://example.com/story",
      "source": "Example Source",
      "published_at": "2026-02-02T08:15:00+00:00",
      "summary": "Short summary text."
    }
  ],
  "mood": {
    "affirmation": "You don't have to do everything today — just the next right thing.",
    "focus_prompt": "Pick one small win for the next 20 minutes. What is it?"
  }
}
```

## Frontend Query Requirements

### 1) Obtain Location (lat/lon)

- Use the platform geolocation API (or stored user location) to get `lat` and `lon`.
- If permission is denied/unavailable, fall back to the user’s saved location (if the app supports it). If neither is available, do not call the endpoint.

### 2) Obtain Timezone

- Use the device timezone (recommended):
  - Web: `Intl.DateTimeFormat().resolvedOptions().timeZone`
  - iOS/Android equivalents if native

### 3) Build Request URL

Use `URLSearchParams` to ensure proper encoding:

```ts
const params = new URLSearchParams({
  lat: String(lat),
  lon: String(lon),
  timezone,
  limit: String(limit ?? 10),
});

if (q?.trim()) params.set("q", q.trim());

const url = `${API_BASE_URL}/api/v1/dashboard/morning?${params.toString()}`;
```

### 4) Fetch + Validate

- Send credentials/headers according to your app’s existing API client conventions.
- Parse JSON and treat it as `DashboardMorningResponse`.
- If you have a runtime validator (e.g., zod), validate the shape at the boundary.

```ts
const res = await fetch(url, { method: "GET" });
if (!res.ok) throw new Error(`dashboard.morning ${res.status}`);
const data = (await res.json()) as DashboardMorningResponse;
```

## Rendering Map (My Day)

Map the response fields into the existing placeholders:

- Mood / intention
  - Primary text: `mood.affirmation`
  - Secondary prompt: `mood.focus_prompt`

- Weather slot
  - Temperature: `weather.current.temp_c` (convert to F if your UI is Fahrenheit-first)
  - Condition: `weather.current.condition_text` (nullable; hide if null)
  - Optional details (nullable; show only if present):
    - Feels like: `weather.current.feels_like_c`
    - Wind: `weather.current.wind_kph`
    - Precip: `weather.current.precipitation_mm`

- News list slot
  - Items: `news` (already limited by `limit`)
  - Per item:
    - Title: `headline`
    - Source: `source`
    - Timestamp: `published_at` (if non-null; format in user timezone)
    - Summary: `summary` (if present)
    - Tap/click: open `url`

## Errors and UX Expectations

- `422 Unprocessable Entity`: invalid/missing query params (frontend bug or bad inputs); surface a lightweight error state and log for debugging.
- `502 Bad Gateway`: upstream feed/weather failed; show “temporarily unavailable” state for affected content.
- Network/offline: show cached content if available; otherwise show offline empty state.

## Suggested Client Behavior

- Cache last successful response (in-memory or persisted) keyed by `(lat, lon, timezone, limit, q)`.
- Refresh triggers:
  - On entering **My Day**
  - Manual pull-to-refresh
  - Optional: time-based refresh (e.g., every 10–20 minutes)
