// Shared returns / refunds vocabulary for RYmos.
//
// Source of truth for the DB shapes (see supabase/migrations/20261105_returns.sql,
// which reconciles the two shipped variants):
//  - initial schema 20260907000000: returns.status 'pending'|'approved'|'rejected'|'processed',
//    reason 'defective'|'exchange'|'other'; refunds.method 'cash'|'bkash'|'nagad'|'bank'|'credit_adjustment'.
//  - prod sync SQL sync_20260922_prod_sync.sql: returns.status 'requested'|'approved'|'rejected'|'completed',
//    reason 'defective'|'exchange'|'other'; refunds.method 'cash'|'bkash'|'nagad'|'bank'.
// The 20261105 migration widens both CHECKs so every value below is accepted.
// Refunds are NEVER online: cash / bKash / Nagad / Rocket / card, paid in store
// or on delivery. There is no payment-gateway refund.

export type ReturnReasonValue =
  | "damaged"
  | "wrong_item"
  | "not_as_described"
  | "changed_mind"
  | "other"
  // Legacy values kept for rows created before the 20261105 migration.
  | "defective"
  | "exchange";

export const RETURN_REASONS: { value: ReturnReasonValue; label: string }[] = [
  { value: "damaged", label: "Damaged / defective item" },
  { value: "wrong_item", label: "Wrong item delivered" },
  { value: "not_as_described", label: "Not as described" },
  { value: "changed_mind", label: "Changed my mind" },
  { value: "other", label: "Other" },
];

export function returnReasonLabel(reason: string): string {
  const found = RETURN_REASONS.find((r) => r.value === reason);
  if (found) return found.label;
  if (reason === "defective") return "Damaged / defective item";
  if (reason === "exchange") return "Exchange";
  return reason;
}

export type RefundMethodValue = "cash" | "bkash" | "nagad" | "rocket" | "card" | "bank";

export const REFUND_METHODS: { value: RefundMethodValue; label: string }[] = [
  { value: "cash", label: "Cash (in store / on delivery)" },
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
  { value: "rocket", label: "Rocket" },
  { value: "card", label: "Card (in store)" },
];

export function refundMethodLabel(method: string): string {
  const found = REFUND_METHODS.find((m) => m.value === method);
  if (found) return found.label;
  if (method === "bank") return "Bank transfer";
  return method;
}

/** Union of both shipped status vocabularies + the widened one. */
export type ReturnStatus =
  | "requested"
  | "pending"
  | "approved"
  | "rejected"
  | "processed"
  | "completed";

export const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  requested: "Requested",
  pending: "Requested",
  approved: "Approved",
  rejected: "Rejected",
  processed: "Processed",
  completed: "Refunded",
};

export const RETURN_STATUS_COLORS: Record<ReturnStatus, { background: string; color: string }> = {
  requested: { background: "#fff8e1", color: "#f57f17" },
  pending: { background: "#fff8e1", color: "#f57f17" },
  approved: { background: "#e3f2fd", color: "#1565c0" },
  rejected: { background: "#ffebee", color: "#c62828" },
  processed: { background: "#e8eaf6", color: "#283593" },
  completed: { background: "#e8f5e9", color: "#2e7d32" },
};

/** A return the admin still has to decide on. */
export function isOpenReturnStatus(status: string): boolean {
  return status === "requested" || status === "pending";
}

export type RefundStatus = "pending" | "processing" | "processed" | "completed" | "failed";

export const REFUND_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  processed: "Processed",
  completed: "Completed",
  failed: "Failed",
};

export interface ReturnItemDetail {
  product_id?: string;
  name: string;
  quantity: number;
  price: number;
  variant?: string;
}

/**
 * Extra return data kept in returns.product_details (JSONB), so the request
 * survives on either shipped schema variant: the picked items + quantities
 * and the customer's note. `quantity` (total) and `notes` are also stored in
 * their own columns when the 20261105 migration has been applied.
 */
export interface ReturnProductDetails {
  items?: ReturnItemDetail[];
  note?: string;
  reason_label?: string;
  admin_note?: string;
}

export function parseReturnDetails(value: unknown): ReturnProductDetails {
  if (value && typeof value === "object") return value as ReturnProductDetails;
  return {};
}

export interface ReturnRequest {
  id: string;
  order_id: string;
  customer_id: string;
  reason: string;
  product_details: ReturnProductDetails | null;
  refund_amount: number | null;
  quantity?: number | null;
  notes?: string | null;
  resolution?: string | null;
  status: ReturnStatus;
  requested_at?: string | null;
  processed_at?: string | null;
  created_at: string;
  orders?: { order_number: string; total: number } | null;
  customers?: { full_name: string; phone: string } | null;
}

export interface RefundRecord {
  id: string;
  return_id: string | null;
  order_id: string;
  amount: number;
  method: string;
  status: string;
  reference?: string | null;
  created_at: string;
}
