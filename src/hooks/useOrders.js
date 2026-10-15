// src/hooks/useOrders.js
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BACKEND_URL ="/backend";

// ─── Get All Orders ────────────────────────────────────────────────
export function useGetOrders({
  userId = null,
  status = "ALL",
  deliveryStatus = "ALL",
  search = "",
  page = 1,
  limit = 20,
} = {}) {
  return useQuery({
    queryKey: ["orders", userId, status, deliveryStatus, search, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (userId) params.append("userId", userId);
      params.append("status", status);
      params.append("deliveryStatus", deliveryStatus);
      params.append("search", search);
      params.append("page", page);
      params.append("limit", limit);

      const res = await fetch(
        `${BACKEND_URL}/admins/orders/get-all?${params.toString()}`
      );
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    },
    refetchInterval: 10000,
    staleTime: 0,
  });
}

// ─── Get Single Order ──────────────────────────────────────────────
export function useGetSingleOrder(orderId) {
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const res = await fetch(
        `${BACKEND_URL}/admins/orders/get-single?orderId=${orderId}`
      );
      if (!res.ok) throw new Error("Failed to fetch order");
      return res.json();
    },
    enabled: !!orderId,
  });
}

// ─── Update Order Status ───────────────────────────────────────────
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      status,
      deliveryStatus,
      paymentStatus,
      estimatedDelivery,
    }) => {
      const res = await fetch(`${BACKEND_URL}/admins/orders/update-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          status,
          deliveryStatus,
          paymentStatus,
          estimatedDelivery,
        }),
      });

      if (!res.ok) throw new Error("Failed to update order");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order"] });
    },
  });
}

// ─── Assign Delivery Partner ───────────────────────────────────────
export function useAssignDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, partnerId }) => {
      const res = await fetch(`${BACKEND_URL}/admins/orders/assign-delivery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, partnerId }),
      });

      if (!res.ok) throw new Error("Failed to assign delivery partner");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-partners"] });
    },
  });
}

// ─── Get Delivery Partners ─────────────────────────────────────────
export function useGetDeliveryPartners() {
  return useQuery({
    queryKey: ["delivery-partners"],
    queryFn: async () => {
      const res = await fetch(`${BACKEND_URL}/admins/orders/delivery-partners`);
      if (!res.ok) throw new Error("Failed to fetch delivery partners");
      return res.json();
    },
  });
}

// ✅ FIXED: Add missing queryClient
export function useUpdateDeliveryPartner() {
  const queryClient = useQueryClient(); // ✅ This was missing!

  return useMutation({
    mutationFn: async (data) => {
      const res = await fetch(`${BACKEND_URL}/admins/orders/delivery-partners/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update partner");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-partners"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] }); // Also refresh orders to show updated partner info
    },
  });
}

// ─── Create Delivery Partner ───────────────────────────────────────
export function useCreateDeliveryPartner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, phone, vehicleType, isAvailable = true }) => {
      const res = await fetch(`${BACKEND_URL}/admins/orders/delivery-partners`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, vehicleType, isAvailable }),
      });

      if (!res.ok) throw new Error("Failed to create delivery partner");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-partners"] });
    },
  });
}
// src/hooks/useOrders.js - Add this new hook
export function useRemoveDeliveryAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, deliveryId }) => {
      const res = await fetch(`${BACKEND_URL}/admins/orders/remove-delivery-assignment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, deliveryId }),
      });
      if (!res.ok) throw new Error("Failed to remove delivery assignment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["delivery-partners"] });
    },
  });
}

// ─── Get Products ──────────────────────────────────────────────────
export function useGetProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch(`${BACKEND_URL}/products`); // ✅ Fixed URL
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
  });
}