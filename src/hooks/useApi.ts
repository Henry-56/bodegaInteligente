"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Simple data-fetching hook.
 * Takes a URL (or null to skip), calls fetch with credentials,
 * and returns { data, loading, error, refetch }.
 */
export function useApi<T = unknown>(url: string | null): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(!!url);
  const [error, setError] = useState<string | null>(null);
  const urlRef = useRef(url);
  urlRef.current = url;

  const fetchData = useCallback(async () => {
    const currentUrl = urlRef.current;
    if (!currentUrl) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(currentUrl, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.error ?? `Error ${res.status}: ${res.statusText}`
        );
      }

      const json = await res.json();
      // API routes return { data: ... } via the ok() helper
      setData(json.data !== undefined ? json.data : json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [url, fetchData]);

  return { data, loading, error, refetch: fetchData };
}
