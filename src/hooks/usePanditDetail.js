// hooks/usePanditDetail.js
"use client";
import { useState, useEffect, useCallback } from "react";

const BACKEND_URL = "/backend";

export function usePanditDetail(id) {
  const [pandit, setPandit] = useState(null);
  const [payoutHistory, setPayoutHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/admins/pandits/${id}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to load pandit");
      setPandit(data.pandit);
      setPayoutHistory(data.payoutHistory || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { pandit, payoutHistory, loading, error, refetch: fetchDetail };
}