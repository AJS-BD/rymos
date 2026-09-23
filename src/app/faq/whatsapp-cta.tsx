"use client";

import { useEffect, useState } from "react";
import { getSupabase, isConfigured } from "@/lib/supabase";
import { MessageCircle } from "lucide-react";

/**
 * WhatsApp CTA driven by store settings (whatsapp_sender_phone).
 * Reads digits-only number from settings and renders a wa.me link.
 * Renders nothing while the number is unset (or settings table missing),
 * so no broken placeholder links ever ship.
 */
export default function WhatsappCta() {
  const [waDigits, setWaDigits] = useState("");

  useEffect(() => {
    async function loadWhatsApp() {
      if (!isConfigured()) return;
      try {
        const supabase = getSupabase();
        const { data } = await supabase
          .from("settings")
          .select("key, value")
          .eq("category", "store");

        if (data) {
          const row = data.find(
            (item) => item.key === "whatsapp_sender_phone"
          );
          if (row?.value) setWaDigits(row.value.replace(/\D/g, ""));
        }
      } catch {
        // keep hidden — no number, no button
      }
    }
    loadWhatsApp();
  }, []);

  if (!waDigits) return null;

  return (
    <a
      href={`https://wa.me/${waDigits}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
    >
      <MessageCircle className="h-4 w-4" />
      WhatsApp Us
    </a>
  );
}
