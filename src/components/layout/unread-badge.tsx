"use client";

import { useState, useEffect } from "react";
import { getSupabase, isConfigured } from "@/lib/supabase";

export default function UnreadMessageBadge() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const customerId = localStorage.getItem("rymos_customer_id");
    if (!customerId || !isConfigured()) return;

    async function fetchUnread() {
      const supabase = getSupabase();
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("customer_id", customerId)
        .eq("sender", "admin")
        .eq("read", false);
      setUnreadCount(count || 0);
    }

    fetchUnread();

    const channel = getSupabase()
      .channel("unread-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `customer_id=eq.${customerId}`,
        },
        (payload) => {
          if (payload.new.sender === "admin" && !payload.new.read) {
            setUnreadCount((c) => c + 1);
          }
        }
      )
      .on(
        "postgres_changes",
          {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `customer_id=eq.${customerId}`,
        },
        (payload) => {
          if (payload.new.sender === "admin" && payload.new.read && !payload.old.read) {
            setUnreadCount((c) => Math.max(0, c - 1));
          }
        }
      )
      .subscribe();

    return () => {
      getSupabase().removeChannel(channel);
    };
  }, []);

  if (unreadCount === 0) return null;

  return (
    <span className="absolute top-0 right-3 h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-medium flex items-center justify-center">
      {unreadCount > 9 ? "9+" : unreadCount}
    </span>
  );
}
