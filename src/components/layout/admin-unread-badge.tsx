"use client";

import { useState, useEffect } from "react";
import { getSupabase, isConfigured } from "@/lib/supabase";

export default function AdminUnreadBadge() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isConfigured()) return;

    async function fetchUnread() {
      const supabase = getSupabase();
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("sender", "customer")
        .eq("read", false);
      setUnreadCount(count || 0);
    }

    fetchUnread();

    const channel = getSupabase()
      .channel("admin-unread-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          if (payload.new.sender === "customer" && !payload.new.read) {
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
        },
        (payload) => {
          if (payload.new.sender === "customer" && payload.new.read && !payload.old.read) {
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
    <span className="ml-auto h-5 min-w-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-medium flex items-center justify-center">
      {unreadCount > 9 ? "9+" : unreadCount}
    </span>
  );
}
