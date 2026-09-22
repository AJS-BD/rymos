"use client";

import { useState, useEffect } from "react";
import { getSupabase, isConfigured } from "@/lib/supabase";
import Link from "next/link";
import { MessageSquare, Search, Mail, CheckCircle, Clock } from "lucide-react";

interface Conversation {
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  last_sender: string;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "new" | "read" | "replied";
  created_at: string;
}

const SUBJECT_LABELS: Record<string, string> = {
  order: "Order Inquiry",
  product: "Product Question",
  credit: "Credit Application",
  return: "Return / Refund",
  feedback: "Feedback",
  other: "Other",
};

export default function AdminMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contactMsgs, setContactMsgs] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"chats" | "contact">("chats");

  useEffect(() => {
    async function fetchConversations() {
      if (!isConfigured()) {
        setLoading(false);
        return;
      }
      const supabase = getSupabase();

      // Contact form submissions (fail silently if table not yet created in prod)
      const { data: contacts } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (contacts) setContactMsgs(contacts as ContactMessage[]);

      // Get all messages ordered by time
      const { data: messages } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (!messages) {
        setLoading(false);
        return;
      }

      // Group by customer_id
      const conversationMap = new Map<string, Conversation>();

      for (const msg of messages) {
        if (conversationMap.has(msg.customer_id)) continue; // Already have the latest

        // Count unread messages from customer
        const unreadCount = messages.filter(
          (m) => m.customer_id === msg.customer_id && m.sender === "customer" && !m.read
        ).length;

        // Get customer info
        const { data: customer } = await supabase
          .from("customers")
          .select("full_name, phone")
          .eq("id", msg.customer_id)
          .single();

        conversationMap.set(msg.customer_id, {
          customer_id: msg.customer_id,
          customer_name: customer?.full_name || "Unknown Customer",
          customer_phone: customer?.phone || "",
          last_message: msg.content,
          last_message_time: msg.created_at,
          unread_count: unreadCount,
          last_sender: msg.sender,
        });
      }

      setConversations(Array.from(conversationMap.values()));
      setLoading(false);
    }

    fetchConversations();

    // Realtime subscription for new messages
    const channel = getSupabase()
      .channel("admin-conversations")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMsg = payload.new as {
            id: string;
            customer_id: string;
            sender: "customer" | "admin";
            content: string;
            read: boolean;
            created_at: string;
          };

          setConversations((prev) => {
            const existing = prev.find((c) => c.customer_id === newMsg.customer_id);
            if (existing) {
              // Update existing conversation
              return prev.map((c) =>
                c.customer_id === newMsg.customer_id
                  ? {
                      ...c,
                      last_message: newMsg.content,
                      last_message_time: newMsg.created_at,
                      last_sender: newMsg.sender,
                      unread_count:
                        newMsg.sender === "customer" && !newMsg.read
                          ? c.unread_count + 1
                          : c.unread_count,
                    }
                  : c
              );
            } else {
              // New conversation - need to fetch customer info
              fetchCustomerAndAdd(newMsg);
              return prev;
            }
          });
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
          const updatedMsg = payload.new as {
            id: string;
            customer_id: string;
            sender: "customer" | "admin";
            content: string;
            read: boolean;
            created_at: string;
          };

          setConversations((prev) =>
            prev.map((c) => {
              if (c.customer_id !== updatedMsg.customer_id) return c;
              // Recalculate unread count if read status changed
              if (updatedMsg.sender === "customer" && updatedMsg.read && !payload.old.read) {
                return { ...c, unread_count: Math.max(0, c.unread_count - 1) };
              }
              return c;
            })
          );
        }
      )
      .subscribe();

    async function fetchCustomerAndAdd(msg: {
      customer_id: string;
      sender: "customer" | "admin";
      content: string;
      read: boolean;
      created_at: string;
    }) {
      const supabase = getSupabase();
      const { data: customer } = await supabase
        .from("customers")
        .select("full_name, phone")
        .eq("id", msg.customer_id)
        .single();

      const newConv: Conversation = {
        customer_id: msg.customer_id,
        customer_name: customer?.full_name || "Unknown Customer",
        customer_phone: customer?.phone || "",
        last_message: msg.content,
        last_message_time: msg.created_at,
        unread_count: msg.sender === "customer" && !msg.read ? 1 : 0,
        last_sender: msg.sender,
      };

      setConversations((prev) => [newConv, ...prev]);
    }

    return () => {
      getSupabase().removeChannel(channel);
    };
  }, []);

  const filteredConversations = conversations.filter((conv) =>
    conv.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredContacts = contactMsgs.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const newContactCount = contactMsgs.filter((m) => m.status === "new").length;

  const markContactRead = async (id: string, status: ContactMessage["status"]) => {
    const supabase = getSupabase();
    await supabase.from("contact_messages").update({ status }).eq("id", id);
    setContactMsgs((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status } : m))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-500">
            {activeTab === "chats"
              ? `${conversations.length} conversation${conversations.length !== 1 ? "s" : ""}`
              : `${contactMsgs.length} contact submission${contactMsgs.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={activeTab === "chats" ? "Search conversations..." : "Search submissions..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("chats")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "chats"
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Customer Chats
        </button>
        <button
          onClick={() => setActiveTab("contact")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "contact"
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          <Mail className="h-4 w-4" />
          Contact Form
          {newContactCount > 0 && (
            <span className="ml-1 h-5 min-w-5 px-1.5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
              {newContactCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === "contact" ? (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-pulse text-gray-400">Loading submissions...</div>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-8 text-center">
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Mail className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-gray-500">No contact form submissions yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Messages from the public contact page will appear here
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredContacts.map((msg) => (
                <div key={msg.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900">{msg.name}</p>
                        {msg.status === "new" && (
                          <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" aria-label="New" />
                        )}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {SUBJECT_LABELS[msg.subject] || msg.subject}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(msg.created_at).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <a
                        href={`mailto:${msg.email}`}
                        className="text-xs text-blue-600 hover:underline mt-0.5 inline-block"
                      >
                        {msg.email}
                      </a>
                      <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{msg.message}</p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      {msg.status !== "read" && msg.status !== "replied" && (
                        <button
                          onClick={() => markContactRead(msg.id, "read")}
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <Clock className="h-3 w-3" />
                          Mark read
                        </button>
                      )}
                      {msg.status !== "replied" && (
                        <a
                          href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(
                            SUBJECT_LABELS[msg.subject] || msg.subject
                          )}`}
                          onClick={() => markContactRead(msg.id, "replied")}
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                        >
                          <CheckCircle className="h-3 w-3" />
                          Reply
                        </a>
                      )}
                      {msg.status === "replied" && (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 px-2.5 py-1.5">
                          <CheckCircle className="h-3 w-3" />
                          Replied
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-pulse text-gray-400">Loading conversations...</div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center">
            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-500">No messages yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Customer conversations will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredConversations.map((conv) => (
              <Link
                key={conv.customer_id}
                href={`/admin/messages/${conv.customer_id}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                {/* Avatar */}
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                  <span className="text-sm font-medium text-gray-600">
                    {conv.customer_name.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {conv.customer_name}
                    </p>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">
                      {new Date(conv.last_message_time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-sm text-gray-500 truncate">
                      {conv.last_sender === "admin" && (
                        <span className="text-gray-400">You: </span>
                      )}
                      {conv.last_message}
                    </p>
                    {conv.unread_count > 0 && (
                      <span className="ml-2 shrink-0 h-5 min-w-5 px-1.5 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-medium">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  {conv.customer_phone && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {conv.customer_phone}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      )}
    </div>
  );
}
