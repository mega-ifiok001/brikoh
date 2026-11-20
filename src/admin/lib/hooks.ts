import { useCallback, useEffect, useRef, useState } from "react";
import { adminApi, errMsg, qs, type Params } from "./adminApi";

export function useDebounced<T>(value: T, ms = 400): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

interface PageRes<T> {
  items: T[];
  nextCursor: string | null;
}

/**
 * Cursor-paginated list. Changing `path`/`params` resets to page 1.
 * NOTE: every admin read is audit-logged server-side, so callers should
 * debounce free-text filters (see useDebounced) and never poll.
 */
export function usePaged<T = any>(path: string, params: Params = {}, enabled = true) {
  const key = path + qs(params);
  const [items, setItems] = useState<T[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const seq = useRef(0);

  const fetchPage = useCallback(
    async (cursor: string | null, reset: boolean) => {
      const id = ++seq.current;
      if (cursor) setLoadingMore(true);
      else {
        setLoading(true);
        setError("");
        if (reset) {
          setItems([]);
          setNext(null);
        }
      }
      try {
        const url = cursor ? key + (key.includes("?") ? "&" : "?") + "cursor=" + encodeURIComponent(cursor) : key;
        const res = await adminApi.get<PageRes<T>>(url);
        if (id !== seq.current) return;
        const got = res?.items ?? [];
        setItems((prev) => (cursor ? [...prev, ...got] : got));
        setNext(res?.nextCursor ?? null);
      } catch (e) {
        if (id === seq.current) setError(errMsg(e));
      } finally {
        if (id === seq.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [key]
  );

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    fetchPage(null, true);
  }, [fetchPage, enabled]);

  return {
    items,
    loading,
    loadingMore,
    error,
    hasMore: !!next,
    loadMore: () => {
      if (next) fetchPage(next, false);
    },
    reload: () => fetchPage(null, false),
  };
}

/** Single GET. Pass `null` as the path to stay idle. */
export function useGet<T = any>(path: string | null, params: Params = {}) {
  const key = path ? path + qs(params) : null;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!key);
  const [error, setError] = useState("");
  const seq = useRef(0);

  const run = useCallback(async () => {
    if (!key) return;
    const id = ++seq.current;
    setLoading(true);
    setError("");
    try {
      const d = await adminApi.get<T>(key);
      if (id === seq.current) setData(d);
    } catch (e) {
      if (id === seq.current) {
        setData(null);
        setError(errMsg(e));
      }
    } finally {
      if (id === seq.current) setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    setData(null);
    if (key) run();
    else setLoading(false);
  }, [key, run]);

  return { data, loading, error, reload: run };
}