"use client";

import { useState, useEffect } from "react";

export type WeatherCurrent = {
  temp_c: number;
  feels_like_c: number | null;
  wind_kph: number | null;
  precipitation_mm: number | null;
  condition_code: number | null;
  condition_text: string | null;
};

export type WeatherLocation = {
  lat: number;
  lon: number;
  timezone: string;
};

export type WeatherCurrentResponse = {
  location: WeatherLocation;
  current: WeatherCurrent;
  generated_at: string; // ISO 8601
};

export type NewsItem = {
  headline: string;
  url: string;
  source: string;
  published_at: string | null; // ISO 8601 or null
  summary: string | null;
};

export type MoodBlock = {
  affirmation: string;
  focus_prompt: string;
};

export type DailyFeedResponse = {
  generated_at: string; // ISO 8601
  weather: WeatherCurrentResponse;
  news: NewsItem[];
  mood: MoodBlock;
};

export function useDailyFeed(limit: number = 10, q?: string) {
  const [data, setData] = useState<DailyFeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboard() {
      try {
        setLoading(true);
        setError(null);

        // 1. Get Geolocation
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          },
        );

        const { latitude: lat, longitude: lon } = position.coords;
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // 2. Build URL
        const params = new URLSearchParams({
          lat: String(lat),
          lon: String(lon),
          timezone,
          limit: String(limit),
        });

        if (q?.trim()) {
          params.set("q", q.trim());
        }

        const apiBase =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
        const url = `${apiBase}/api/v1/dashboard/daily-feed?${params.toString()}`;

        // 3. Fetch Data
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Failed to fetch dashboard: ${res.status}`);
        }

        const jsonData = (await res.json()) as DailyFeedResponse;

        if (isMounted) {
          setData(jsonData);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "An error occurred while fetching the dashboard.",
          );
          setLoading(false);
        }
      }
    }

    fetchDashboard();

    return () => {
      isMounted = false;
    };
  }, [limit, q]);

  return { data, loading, error };
}
