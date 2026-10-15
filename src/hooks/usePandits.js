"use client";
import { useState, useEffect, useCallback, useRef } from "react";

const BACKEND_URL ="/backend";
const LIMIT = 20;

export function usePandits(filters = {}) {
  const [pandits, setPandits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const abortRef = useRef(null);

  const fetchPandits = useCallback(
    async (pageNum, replace = false) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (replace) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.status) params.set("status", filters.status);
      if (filters.sortBy) params.set("sortBy", filters.sortBy);
      params.set("page", String(pageNum));
      params.set("limit", String(LIMIT));

      try {
        const res = await fetch(`${BACKEND_URL}/admins/pandits?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Failed to load pandits");

        setPandits((prev) => (replace ? data.pandits : [...prev, ...data.pandits]));
        setTotal(data.total || 0);
        setHasMore(pageNum < (data.totalPages || 1));
        setPage(pageNum);
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filters.search, filters.status, filters.sortBy]
  );

  // reset + reload whenever filters change
  useEffect(() => {
    setPandits([]);
    setHasMore(true);
    fetchPandits(1, true);
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.status, filters.sortBy]);

  const loadMore = useCallback(() => {
    if (!loadingMore && !loading && hasMore) {
      fetchPandits(page + 1);
    }
  }, [fetchPandits, page, hasMore, loading, loadingMore]);

  const refetch = useCallback(() => {
    setPandits([]);
    setHasMore(true);
    fetchPandits(1, true);
  }, [fetchPandits]);

  return { pandits, loading, loadingMore, hasMore, total, error, loadMore, refetch };
}