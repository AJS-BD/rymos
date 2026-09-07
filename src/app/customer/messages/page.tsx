"use client";

import { useState, useEffect, useRef } from "react";
import { getSupabase, isConfigured } from "@/lib/supabase";
import ChatBubble from "@/components/chat/chat-bubble";
import ChatInput from "@/components/chat/chat-input";
import { MessageSquare, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Message {
  id: string;
  customer_id: string;
  sender: "customer" | "admin";
  content: string;
  read: boolean;
  created_at: string;
}

export default function CustomerMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // For demo/dev purposes, use a default customer ID if not authenticated
    // In production, this would come from auth session
    const storedId = localStorage.getItem("rymos_customer_id");
    if (storedId) {
      setCustomerId(storedId);
    } else {
      // Create a demo customer ID for development
      const demoId = crypto.randomUUID();
      localStorage.setItem("rymos_customer_id", demoId);
      setCustomerId(demoId);
    }
  }, []);

  useEffect(() => {
    if (!customerId) return;

    async function fetchMessages() {
      if (!isConfigured()) {
        setLoading(false);
        return;
      }
      const supabase = getSupabase();
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: true });

      if (data) {
        setMessages(data as Message[]);
        // Mark admin messages as read
        const unreadAdmin = data.filter(
          (m: Message) => m.sender === "admin" && !m.read
        );
        if (unreadAdmin.length > 0) {
          const ids = unreadAdmin.map((m: Message) => m.id);
          await supabase
            .from("messages")
            .update({ read: true })
            .in("id", ids);
        }
      }
      setLoading(false);
    }

    fetchMessages();

    // Realtime subscription
    const channel = getSupabase()
      .channel("customer-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `customer_id=eq.${customerId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      getSupabase().removeChannel(channel);
    };
  }, [customerId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (content: string) => {
    if (!customerId || !isConfigured()) return;
    setSending(true);

    const supabase = getSupabase();
    const { data } = await supabase
      .from("messages")
      .insert({
        customer_id: customerId,
        sender: "customer",
        content,
        read: false,
      })
      .select()
      .single();

    if (data) {
      setMessages((prev) => [...prev, data as Message]);
    }
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/" className="text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-gray-900 flex items-center justify-center">
            <MessageSquare className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">RYmos Support</h1>
            <p className="text-xs text-green-600">Online</p>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-pulse text-gray-400">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Start a conversation
            </h2>
            <p className="text-sm text-gray-500 max-w-xs">
              Have a question about your order or our products? Send us a message and we&apos;ll get back to you soon.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                content={msg.content}
                sender={msg.sender}
                timestamp={msg.created_at}
                read={msg.read}
                isOwn={msg.sender === "customer"}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        placeholder="Type your message..."
        disabled={sending}
      />
    </div>
  );
}
