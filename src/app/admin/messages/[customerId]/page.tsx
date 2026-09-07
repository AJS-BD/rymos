"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { getSupabase, isConfigured } from "@/lib/supabase";
import ChatBubble from "@/components/chat/chat-bubble";
import ChatInput from "@/components/chat/chat-input";
import { ArrowLeft, Phone, User } from "lucide-react";
import Link from "next/link";

interface Message {
  id: string;
  customer_id: string;
  sender: "customer" | "admin";
  content: string;
  read: boolean;
  created_at: string;
}

interface Customer {
  id: string;
  full_name: string;
  phone: string;
  username: string;
}

export default function AdminConversation() {
  const params = useParams();
  const customerId = params.customerId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchData() {
      if (!isConfigured() || !customerId) {
        setLoading(false);
        return;
      }
      const supabase = getSupabase();

      // Fetch customer info
      const { data: customerData } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .single();

      if (customerData) {
        setCustomer(customerData as Customer);
      }

      // Fetch messages
      const { data: messageData } = await supabase
        .from("messages")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: true });

      if (messageData) {
        setMessages(messageData as Message[]);

        // Mark customer messages as read
        const unreadCustomer = messageData.filter(
          (m: Message) => m.sender === "customer" && !m.read
        );
        if (unreadCustomer.length > 0) {
          const ids = unreadCustomer.map((m: Message) => m.id);
          await supabase
            .from("messages")
            .update({ read: true })
            .in("id", ids);
        }
      }

      setLoading(false);
    }

    fetchData();

    // Realtime subscription
    const channel = getSupabase()
      .channel(`admin-conversation-${customerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `customer_id=eq.${customerId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            // Prevent duplicates when we sent the message ourselves
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
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
          const updated = payload.new as Message;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m))
          );
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
        sender: "admin",
        content,
        read: false,
      })
      .select()
      .single();

    if (data) {
      setMessages((prev) => {
        // Avoid duplicates if subscription already delivered it
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, data as Message];
      });
    }
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link
          href="/admin/messages"
          className="text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">
              {customer?.full_name || "Loading..."}
            </h1>
            {customer?.phone && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {customer.phone}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-pulse text-gray-400">Loading conversation...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <p className="text-gray-500">No messages yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Start the conversation by sending a message below
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
                isOwn={msg.sender === "admin"}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        placeholder="Reply to customer..."
        disabled={sending}
      />
    </div>
  );
}
