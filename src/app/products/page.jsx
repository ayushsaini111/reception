// src/app/admin/products/page.jsx
"use client";

import { useState, useMemo,useEffect } from "react";
import {
  useGetOrders,
  useUpdateOrderStatus,
  useAssignDelivery,
  useGetDeliveryPartners,
  useCreateDeliveryPartner,
  useUpdateDeliveryPartner,
    useRemoveDeliveryAssignment,
  useGetProducts,
} from "@/hooks/useOrders";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// ─── Constants ────────────────────────────────────────────────────
const ORDER_STATUSES = [
  "ALL",
  "PENDING",
  "CONFIRMED", 
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

const DELIVERY_STATUSES = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "PICKED_UP", 
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "FAILED",
  "RETURNED",
];

const STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  CONFIRMED: "bg-blue-100 text-blue-800 border-blue-200", 
  PROCESSING: "bg-purple-100 text-purple-800 border-purple-200",
  SHIPPED: "bg-indigo-100 text-indigo-800 border-indigo-200",
  DELIVERED: "bg-green-100 text-green-800 border-green-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200",
  REFUNDED: "bg-gray-100 text-gray-800 border-gray-200",
  FAILED: "bg-red-100 text-red-800 border-red-200",
  PICKED_UP: "bg-blue-100 text-blue-800 border-blue-200",
  IN_TRANSIT: "bg-orange-100 text-orange-800 border-orange-200", 
  OUT_FOR_DELIVERY: "bg-teal-100 text-teal-800 border-teal-200",
  RETURNED: "bg-gray-100 text-gray-800 border-gray-200",
  SUCCESS: "bg-green-100 text-green-800 border-green-200",
  PAID: "bg-green-100 text-green-800 border-green-200",
};

const DELIVERY_FLOW = [
  { key: "PENDING", label: "Pending", icon: "⏳" },
  { key: "CONFIRMED", label: "Confirmed", icon: "✅" },
  { key: "PICKED_UP", label: "Picked Up", icon: "📦" },
  { key: "IN_TRANSIT", label: "In Transit", icon: "🚚" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: "🛵" },
  { key: "DELIVERED", label: "Delivered", icon: "🎉" },
];

// ─── Helpers ───────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short", 
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR", 
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function StatusBadge({ status, small = false }) {
  return (
    <span
      className={`inline-flex items-center ${small ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs'} rounded-full font-medium border ${
        STATUS_COLORS[status] || "bg-gray-100 text-gray-700 border-gray-200"
      }`}
    >
      {status?.replace(/_/g, " ")}
    </span>
  );
}

// ─── Stats Cards ───────────────────────────────────────────────────
function StatsBar({ stats, orders }) {
  const calculatedStats = useMemo(() => {
    const totalOrders = orders?.length || 0;
    const pendingOrders = orders?.filter((o) => o.status === "PENDING").length || 0;
    const shippedOrders = orders?.filter((o) => o.deliveryStatus === "IN_TRANSIT").length || 0;
    const deliveredOrders = orders?.filter((o) => o.deliveryStatus === "DELIVERED").length || 0;
    const revenue = stats?.totalRevenue || 0;

    return { totalOrders, pendingOrders, shippedOrders, deliveredOrders, revenue };
  }, [orders, stats]);

  const cards = [
    {
      label: "Total Orders",
      value: calculatedStats.totalOrders,
      icon: "📋",
      color: "bg-blue-50 border-blue-200",
    },
    {
      label: "Pending", 
      value: calculatedStats.pendingOrders,
      icon: "⏳",
      color: "bg-yellow-50 border-yellow-200",
    },
    {
      label: "In Transit",
      value: calculatedStats.shippedOrders,
      icon: "🚚", 
      color: "bg-orange-50 border-orange-200",
    },
    {
      label: "Delivered",
      value: calculatedStats.deliveredOrders,
      icon: "✅",
      color: "bg-green-50 border-green-200", 
    },
    {
      label: "Revenue",
      value: formatCurrency(calculatedStats.revenue),
      icon: "💰",
      color: "bg-purple-50 border-purple-200",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-xl border p-4 ${card.color}`}
        >
          <div className="text-2xl mb-1">{card.icon}</div>
          <div className="text-xl font-bold text-gray-800">{card.value}</div>
          <div className="text-xs text-gray-500 mt-0.5">{card.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Delivery Progress Bar ─────────────────────────────────────────
function DeliveryProgress({ currentStatus }) {
  const currentIndex = DELIVERY_FLOW.findIndex((s) => s.key === currentStatus);

  return (
    <div className="flex items-center gap-1 py-3 overflow-x-auto">
      {DELIVERY_FLOW.map((step, index) => {
        const isDone = index <= currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={step.key} className="flex items-center">
            <div
              className={`flex flex-col items-center min-w-[60px] ${
                isDone ? "opacity-100" : "opacity-30"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition-all ${
                  isCurrent
                    ? "border-purple-600 bg-purple-600 text-white scale-110"
                    : isDone
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-gray-300 bg-white"
                }`}
              >
                {step.icon}
              </div>
              <span className="text-[10px] text-center mt-1 text-gray-600 leading-tight">
                {step.label}
              </span>
            </div>
            {index < DELIVERY_FLOW.length - 1 && (
              <div
                className={`h-0.5 w-6 mx-0.5 mb-4 transition-all ${
                  index < currentIndex ? "bg-green-400" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Order Detail Modal ────────────────────────────────────────────


function OrderDetailModal({ order, onClose, onUpdateStatus, onAssign }) {
  const [selectedStatus, setSelectedStatus] = useState(order.status);
  const [selectedDelivery, setSelectedDelivery] = useState(order.deliveryStatus);
  const [selectedPartner, setSelectedPartner] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState(
    order.estimatedDelivery ? new Date(order.estimatedDelivery).toISOString().slice(0, 16) : ""
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const { data: partnersData } = useGetDeliveryPartners();
  const partners = partnersData?.partners || [];
  const removeDeliveryAssignment = useRemoveDeliveryAssignment();

  // ✅ ADD THIS: Find current assignment
  const currentAssignment = useMemo(() => {
    return order.deliveries?.[0] || null;
  }, [order.deliveries]);

  const currentPartner = currentAssignment?.partner;

  async function handleUpdate() {
    setIsUpdating(true);
    try {
      await onUpdateStatus({
        orderId: order.id,
        status: selectedStatus !== order.status ? selectedStatus : undefined,
        deliveryStatus:
          selectedDelivery !== order.deliveryStatus ? selectedDelivery : undefined,
        estimatedDelivery: estimatedDelivery || undefined,
      });
      onClose();
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleAssign() {
    if (!selectedPartner) return;
    setIsAssigning(true);
    try {
      await onAssign({ orderId: order.id, partnerId: selectedPartner });
      onClose();
    } finally {
      setIsAssigning(false);
    }
  }

  // ✅ ADD THIS: Handle remove assignment
  async function handleRemoveAssignment() {
    if (!currentAssignment) return;
    
    const confirmed = confirm(
      `Remove ${currentPartner?.name} from this delivery?\nOrder status will be reset to PENDING.`
    );
    
    if (confirmed) {
      try {
        await removeDeliveryAssignment.mutateAsync({
          orderId: order.id,
          deliveryId: currentAssignment.id
        });
        onClose();
      } catch (error) {
        alert('Failed to remove assignment: ' + error.message);
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="font-bold text-lg text-gray-800">Order Details</h2>
            <p className="text-sm text-gray-500 font-mono">#{order.orderId}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Delivery Progress */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-2">
              Delivery Progress
            </h3>
            <DeliveryProgress currentStatus={order.deliveryStatus} />
          </div>

          {/* Customer Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">
              👤 Customer Details
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Name</span>
                <p className="font-medium text-gray-800">
                  {order.customerName || order.user?.name || "—"}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Phone</span>
                <p className="font-medium text-gray-800">
                  {order.customerPhone || order.user?.phone || "—"}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Email</span>
                <p className="font-medium text-gray-800">
                  {order.customerEmail || order.user?.email || "—"}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Order Date</span>
                <p className="font-medium text-gray-800">
                  {formatDate(order.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-blue-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">
              📍 Delivery Address
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              {order.fullAddress || 
               [order.houseNo, order.address, order.landmark, order.pinCode]
                 .filter(Boolean)
                 .join(", ") ||
               "Address not provided"}
            </p>
            {/* GPS Coordinates */}
            {order.latitude && order.longitude && (
              <p className="text-xs text-gray-500 mt-2 font-mono">
                📍 GPS: {order.latitude.toFixed(6)}, {order.longitude.toFixed(6)}
              </p>
            )}
          </div>

          {/* Product Info */}
          <div className="bg-orange-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">
              📦 Product Details
            </h3>
            {order.items && order.items.length > 0 ? (
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center text-sm"
                  >
                    <div>
                      <p className="font-medium text-gray-800">
                        {item.productId}
                      </p>
                      <p className="text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  {order.productImage && (
                    <img
                      src={order.productImage}
                      alt={order.productTitle}
                      className="w-12 h-12 rounded-lg object-cover border"
                    />
                  )}
                  <div>
                    <p className="font-medium text-gray-800">
                      {order.productTitle || "Product"}
                    </p>
                    <p className="text-gray-500">Qty: {order.quantity || 1}</p>
                  </div>
                </div>
                <p className="font-semibold">{formatCurrency(order.totalAmount)}</p>
              </div>
            )}

            <div className="border-t border-orange-200 mt-3 pt-3 flex justify-between text-sm font-bold">
              <span>Total Amount</span>
              <span className="text-orange-700">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
          </div>

          {/* Delivery Information */}
          {order.estimatedDelivery && (
            <div className="bg-teal-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">
                📅 Delivery Schedule
              </h3>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Estimated Delivery:</span>{" "}
                {formatDate(order.estimatedDelivery)}
              </p>
            </div>
          )}

          {/* Payment Status */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Payment Status:</span>
            <StatusBadge status={order.paymentStatus} />
            {order.razorpayPaymentId && (
              <span className="text-xs text-gray-400 font-mono">
                {order.razorpayPaymentId}
              </span>
            )}
          </div>

          {/* ✅ REPLACE THE EXISTING ASSIGNMENT SECTION WITH THIS: */}

          {/* Current Assignment (if exists) */}
          {currentAssignment && currentPartner && (
            <div className="bg-orange-50 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">
                📋 Current Assignment
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    {currentPartner.vehicleType === "BIKE" ? "🏍️" : 
                     currentPartner.vehicleType === "CAR" ? "🚗" : 
                     currentPartner.vehicleType === "VAN" ? "🚐" : 
                     currentPartner.vehicleType === "TRUCK" ? "🚛" : "🛵"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {currentPartner.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {currentPartner.phone} • {currentPartner.vehicleType}
                    </p>
                    <p className="text-xs text-gray-400">
                      Assigned: {formatDate(currentAssignment.assignedAt)}
                    </p>
                    <p className="text-xs text-blue-600 font-medium">
                      Status: {currentAssignment.status?.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveAssignment}
                  disabled={removeDeliveryAssignment.isPending || order.deliveryStatus === "DELIVERED"}
                  className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {removeDeliveryAssignment.isPending ? "Removing..." : "Remove"}
                </button>
              </div>
              
              {order.deliveryStatus === "DELIVERED" && (
                <div className="text-xs text-green-600 bg-green-50 p-2 rounded-lg border border-green-200">
                  ✅ Order delivered successfully - Assignment completed
                </div>
              )}
            </div>
          )}

          {/* Assign Delivery Partner - Only show if no current assignment */}
          {!currentAssignment && (
            <div className="bg-green-50 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">
                🚚 Assign Delivery Partner
              </h3>
              <div className="flex gap-2">
                <select
                  value={selectedPartner}
                  onChange={(e) => setSelectedPartner(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                  <option value="">Select Partner</option>
                  {/* Only show available partners for assignment */}
                  {partners.filter(p => p.isAvailable).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.vehicleType}) — {p.deliveries?.length || 0} active
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAssign}
                  disabled={!selectedPartner || isAssigning}
                  className="bg-green-600 text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isAssigning ? "..." : "Assign"}
                </button>
              </div>
              {partners.filter(p => p.isAvailable).length === 0 ? (
                <p className="text-xs text-red-500">
                  No available delivery partners. Please enable a partner first.
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  {partners.filter(p => p.isAvailable).length} available partners
                </p>
              )}
            </div>
          )}

          {/* Update Status */}
          <div className="bg-purple-50 rounded-xl p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">
              🔄 Update Order
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Order Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  {ORDER_STATUSES.filter((s) => s !== "ALL").map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Delivery Status
                </label>
                <select
                  value={selectedDelivery}
                  onChange={(e) => setSelectedDelivery(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  {DELIVERY_STATUSES.filter((s) => s !== "ALL").map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Estimated Delivery Date
              </label>
              <input
                type="datetime-local"
                value={estimatedDelivery}
                onChange={(e) => setEstimatedDelivery(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="w-full bg-purple-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {isUpdating ? "Updating..." : "Update Order"}
            </button>
          </div>

          {/* Special Requests */}
          {order.specialRequests && (
            <div className="bg-yellow-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-600 mb-1">
                📝 Special Requests
              </h3>
              <p className="text-sm text-gray-700">{order.specialRequests}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Order Card ────────────────────────────────────────────────────
// In your admin page - Update OrderCard component
function OrderCard({ order, onClick, partners = [] }) {
  // Find assigned delivery partner from order.deliveries
  const assignedDelivery = useMemo(() => {
    return order.deliveries?.[0] || null;
  }, [order.deliveries]);

  const assignedPartner = assignedDelivery?.partner;

  return (
    <div
      onClick={() => onClick(order)}
      className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:border-purple-300 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-mono text-xs text-gray-400">#{order.orderId}</p>
          <h3 className="font-semibold text-gray-800 text-sm mt-0.5">
            {order.customerName || order.user?.name || "Unknown"}
          </h3>
          <p className="text-xs text-gray-500">
            {order.customerPhone || order.user?.phone}
          </p>
        </div>
        <div className="text-right space-y-1">
          <StatusBadge status={order.status} small />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
        {order.productImage && (
          <img
            src={order.productImage}
            alt={order.productTitle}
            className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-100"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-700 truncate">
            {order.productTitle || `${order.items?.length || 0} item(s)`}
          </p>
          <p className="text-xs text-gray-500">
            Qty: {order.quantity || order.items?.reduce((a, i) => a + i.quantity, 0) || 1}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-gray-800">
            {formatCurrency(order.totalAmount)}
          </p>
          <StatusBadge status={order.paymentStatus} small />
        </div>
      </div>

      {/* Delivery Info Row */}
      <div className="flex items-center justify-between mb-2">
        <StatusBadge status={order.deliveryStatus} small />
        <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
      </div>

      {/* ✅ Delivery Assignment & Estimated Delivery */}
      {(assignedPartner || order.estimatedDelivery) && (
        <div className="border-t border-gray-100 pt-2 mt-2 space-y-1">
          {assignedPartner && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Assigned:</span>
                <span className="text-xs font-medium text-green-600">
                  🚚 {assignedPartner.name}
                </span>
              </div>
              {/* ✅ Show delivery status if not delivered */}
              {order.deliveryStatus !== "DELIVERED" && (
                <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded">
                  {order.deliveryStatus?.replace(/_/g, " ")}
                </span>
              )}
            </div>
          )}
          {order.estimatedDelivery && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">ETA:</span>
              <span className="text-xs font-medium text-blue-600">
                📅 {formatDate(order.estimatedDelivery)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Mini progress */}
      <div className="mt-3 flex gap-1">
        {DELIVERY_FLOW.map((step, i) => {
          const currentIndex = DELIVERY_FLOW.findIndex(
            (s) => s.key === order.deliveryStatus
          );
          return (
            <div
              key={step.key}
              className={`h-1 flex-1 rounded-full transition-all ${
                i <= currentIndex ? "bg-purple-500" : "bg-gray-100"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Add/Edit Delivery Partner Modal ──────────────────────────────
function PartnerModal({ partner, onClose, onCreate, onUpdate }) {
  const [form, setForm] = useState({
    name: partner?.name || "",
    phone: partner?.phone || "",
    vehicleType: partner?.vehicleType || "BIKE",
    isAvailable: partner?.isAvailable ?? true,
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      if (partner) {
        await onUpdate({ id: partner.id, ...form });
      } else {
        await onCreate(form);
      }
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg">
            {partner ? "Edit" : "Add"} Delivery Partner
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Partner name"
              required
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) =>
                setForm((p) => ({ ...p, phone: e.target.value }))
              }
              placeholder="10-digit phone number"
              maxLength={10}
              required
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">
              Vehicle Type
            </label>
            <select
              value={form.vehicleType}
              onChange={(e) =>
                setForm((p) => ({ ...p, vehicleType: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <option value="BIKE">🏍️ Bike</option>
              <option value="SCOOTER">🛵 Scooter</option>
              <option value="CAR">🚗 Car</option>
              <option value="VAN">🚐 Van</option>
              <option value="TRUCK">🚛 Truck</option>
            </select>
          </div>

          {/* Availability Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-600">Available for delivery</label>
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, isAvailable: !p.isAvailable }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                form.isAvailable ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${
                  form.isAvailable ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white rounded-xl py-3 font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {loading ? (partner ? "Updating..." : "Adding...") : (partner ? "Update Partner" : "Add Partner")}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────
export default function ProductsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

  
    useEffect(() => {
      if (status === "unauthenticated") {
        router.push("/login");
      }
    }, [status, router]);
  const [activeTab, setActiveTab] = useState("orders");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deliveryFilter, setDeliveryFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useGetOrders({
    status: statusFilter,
    deliveryStatus: deliveryFilter,
    search,
    page,
  });

  const { data: productsData, isLoading: productsLoading } = useGetProducts();
  const { data: partnersData } = useGetDeliveryPartners();

  const updateOrderStatus = useUpdateOrderStatus();
  const assignDelivery = useAssignDelivery();
  const createPartner = useCreateDeliveryPartner();
  const updatePartner = useUpdateDeliveryPartner();

  const orders = data?.orders || [];
  const pagination = data?.pagination;
  const stats = data?.stats;
  const products = productsData?.products || [];
  const partners = partnersData?.partners || [];

  // Debounced search
  function handleSearch(e) {
    setSearchInput(e.target.value);
    clearTimeout(window._searchTimeout);
    window._searchTimeout = setTimeout(() => {
      setSearch(e.target.value);
      setPage(1);
    }, 500);
  }

  const tabs = [
    { key: "orders", label: "Orders", icon: "📦", count: pagination?.total },
    { key: "products", label: "Products", icon: "🛍️", count: products.length },
    { key: "partners", label: "Delivery Partners", icon: "🚚", count: partners.length },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Products & Dispatch
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage orders, delivery, and products
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-xl p-1.5 border border-gray-200 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs ${
                    activeTab === tab.key
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── ORDERS TAB ── */}
        {activeTab === "orders" && (
          <div>
            <StatsBar stats={stats} orders={orders} />

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 space-y-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  🔍
                </span>
                <input
                  type="text"
                  value={searchInput}
                  onChange={handleSearch}
                  placeholder="Search by name, phone, order ID, product..."
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-2">Order Status</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {ORDER_STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setStatusFilter(s);
                        setPage(1);
                      }}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        statusFilter === s
                          ? "bg-purple-600 text-white border-purple-600"
                          : "bg-white text-gray-600 border-gray-200 hover:border-purple-300"
                      }`}
                    >
                      {s.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-2">Delivery Status</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {DELIVERY_STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setDeliveryFilter(s);
                        setPage(1);
                      }}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                        deliveryFilter === s
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
                      }`}
                    >
                      {s.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Orders Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                    <div className="h-4 bg-gray-100 rounded mb-3 w-3/4" />
                    <div className="h-4 bg-gray-100 rounded mb-2 w-1/2" />
                    <div className="h-8 bg-gray-100 rounded mb-3" />
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">
                <p className="text-4xl mb-3">❌</p>
                <p className="font-medium">Failed to load orders</p>
                <p className="text-sm text-gray-500 mt-1">{error.message}</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <p className="text-5xl mb-4">📦</p>
                <p className="font-medium text-gray-600">No orders found</p>
                <p className="text-sm mt-1">Try adjusting your filters or search</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {orders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onClick={setSelectedOrder}
                      partners={partners}
                    />
                  ))}
                </div>

                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-6">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-40 hover:bg-gray-50"
                    >
                      ← Prev
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {page} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={page === pagination.totalPages}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-40 hover:bg-gray-50"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── PRODUCTS TAB ── */}
        {activeTab === "products" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-700">All Products</h2>
              <span className="text-sm text-gray-500">{products.length} products</span>
            </div>

            {productsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border animate-pulse p-4">
                    <div className="h-32 bg-gray-100 rounded-lg mb-3" />
                    <div className="h-4 bg-gray-100 rounded mb-2" />
                    <div className="h-4 bg-gray-100 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <p className="text-5xl mb-4">🛍️</p>
                <p className="font-medium text-gray-600">No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* ✅ FIXED: Product Image */}
                    <div className="aspect-square bg-gray-50 relative overflow-hidden">
                      {product.images?.[0] || product.image ? (
                        <img
                          src={product.images?.[0] || product.image}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          🛍️
                        </div>
                      )}
                      {!product.isActive && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            Inactive
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-3">
                      {/* ✅ FIXED: Product title */}
                      <h3 className="font-semibold text-sm text-gray-800 truncate">
                        {product.title}
                      </h3>
                      {(product.description || product.shortDescription) && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {product.shortDescription || product.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <p className="font-bold text-purple-700">
                          {formatCurrency(product.price)}
                        </p>
                        {/* ✅ FIXED: Stock status */}
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${
                            product.inStock
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }`}
                        >
                          {product.inStock ? "In Stock" : "Out of Stock"}
                        </span>
                      </div>
                      {/* Additional product info */}
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                        <span>⭐ {product.rating || 0}</span>
                        <span>{product.reviews || 0} reviews</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      

{/* ── DELIVERY PARTNERS TAB ── */}
{activeTab === "partners" && (
  <div>
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="font-semibold text-gray-700">Delivery Partners</h2>
        <p className="text-xs text-gray-500 mt-1">
          {partners.filter(p => p.isAvailable).length} available • {partners.filter(p => !p.isAvailable).length} unavailable
        </p>
      </div>
      <button
        onClick={() => {
          setSelectedPartner(null);
          setShowPartnerModal(true);
        }}
        className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors flex items-center gap-2"
      >
        <span>+</span> Add Partner
      </button>
    </div>

    {partners.length === 0 ? (
      <div className="text-center py-20 text-gray-400">
        <p className="text-5xl mb-4">🚚</p>
        <p className="font-medium text-gray-600">No delivery partners</p>
        <button
          onClick={() => {
            setSelectedPartner(null);
            setShowPartnerModal(true);
          }}
          className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors"
        >
          Add First Partner
        </button>
      </div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {partners.map((partner) => (
          <div
            key={partner.id}
            className={`bg-white rounded-xl border p-4 hover:shadow-md transition-all ${
              !partner.isAvailable ? 'border-gray-300 bg-gray-50' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0 ${
                partner.isAvailable ? 'bg-purple-100' : 'bg-gray-200'
              }`}>
                {partner.vehicleType === "BIKE" ? "🏍️" : 
                 partner.vehicleType === "CAR" ? "🚗" : 
                 partner.vehicleType === "VAN" ? "🚐" : 
                 partner.vehicleType === "TRUCK" ? "🚛" : "🛵"}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold ${partner.isAvailable ? 'text-gray-800' : 'text-gray-500'}`}>
                  {partner.name}
                </h3>
                <p className="text-sm text-gray-500">{partner.phone}</p>
                <p className="text-xs text-gray-400 mt-0.5">{partner.vehicleType}</p>
              </div>
              <div className="text-right space-y-1">
                <span
                  className={`text-xs px-2 py-1 rounded-full border ${
                    partner.isAvailable
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}
                >
                  {partner.isAvailable ? "Available" : "Unavailable"}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setSelectedPartner(partner);
                      setShowPartnerModal(true);
                    }}
                    className="text-xs text-purple-600 hover:text-purple-800 px-2 py-1 rounded hover:bg-purple-50"
                  >
                    Edit
                  </button>
                 
                </div>
              </div>
            </div>

            {partner.deliveries && partner.deliveries.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Active deliveries:{" "}
                  <span className="font-semibold text-orange-600">
                    {partner.deliveries.length}
                  </span>
                </p>
                {/* Show recent deliveries */}
                <div className="mt-1 space-y-1">
                  {partner.deliveries.slice(0, 2).map((delivery) => (
                    <div key={delivery.id} className="text-xs text-gray-400">
                      📦 {delivery.status} • Order #{delivery.orderId}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warning if unavailable with active deliveries */}
            {!partner.isAvailable && partner.deliveries && partner.deliveries.length > 0 && (
              <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-xs text-orange-700">
                  ⚠️ Unavailable but has active deliveries
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
)}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={async (data) => {
            await updateOrderStatus.mutateAsync(data);
          }}
          onAssign={async (data) => {
            await assignDelivery.mutateAsync(data);
          }}
        />
      )}

      {/* Partner Modal */}
      {showPartnerModal && (
        <PartnerModal
          partner={selectedPartner}
          onClose={() => {
            setShowPartnerModal(false);
            setSelectedPartner(null);
          }}
          onCreate={async (data) => {
            await createPartner.mutateAsync(data);
          }}
          onUpdate={async (data) => {
            await updatePartner.mutateAsync(data);
          }}
        />
      )}
    </div>
  );
}