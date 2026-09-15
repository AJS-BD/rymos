"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { getSupabase, isConfigured } from "@/lib/supabase";
import ChatBubble from "@/components/chat/chat-bubble";
import ChatInput from "@/components/chat/chat-input";
import { ArrowLeft, Phone, User, ShoppingBag, X } from "lucide-react";
import Link from "next/link";

interface Message {
  id: string;
  customer_id: string;
  sender: "customer" | "admin";
  content: string;
  read: boolean;
  created_at: string;
  metadata?: {
    product_id?: string;
    product_name?: string;
    product_image?: string;
    product_price?: number;
  };
}

interface Customer {
  id: string;
  full_name: string;
  phone: string;
  username: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  stock: number;
}

export default function AdminConversation() {
  const params = useParams();
  const customerId = params.customerId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchData() {
      if (!isConfigured() || !customerId) {
        setLoading(false);
        return;
      }
      const supabase = getSupabase();

      const { data: customerData } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .single();

      if (customerData) {
        setCustomer(customerData as Customer);
      }

      const { data: messageData } = await supabase
        .from("messages")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: true });

      if (messageData) {
        setMessages(messageData as Message[]);

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

  const fetchProducts = async () => {
    if (!isConfigured()) return;
    const supabase = getSupabase();
    const { data } = await supabase
      .from("products")
      .select("id, name, price, images, stock")
      .gt("stock", 0)
      .order("name");
    if (data) setProducts(data as Product[]);
  };

  const handleOpenProductPicker = () => {
    setShowProductPicker(true);
    fetchProducts();
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowProductPicker(false);
  };

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
        metadata: selectedProduct
          ? {
              product_id: selectedProduct.id,
              product_name: selectedProduct.name,
              product_image: selectedProduct.images?.[0] || null,
              product_price: selectedProduct.price,
            }
          : {},
      })
      .select()
      .single();

    if (data) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, data as Message];
      });
    }
    setSelectedProduct(null);
    setSending(false);
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-14 lg:top-0 z-10">
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
              <div key={msg.id}>
                {msg.metadata?.product_id && (
                  <div className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"} mb-1`}>
                    <Link
                      href={`/products/${msg.metadata.product_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="max-w-[75%] rounded-lg border border-gray-200 bg-white p-2 flex items-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      {msg.metadata.product_image && (
                        <img
                          src={msg.metadata.product_image}
                          alt={msg.metadata.product_name}
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {msg.metadata.product_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          ৳{msg.metadata.product_price?.toLocaleString()}
                        </p>
                      </div>
                    </Link>
                  </div>
                )}
                <ChatBubble
                  content={msg.content}
                  sender={msg.sender}
                  timestamp={msg.created_at}
                  read={msg.read}
                  isOwn={msg.sender === "admin"}
                />
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Selected Product Preview */}
      {selectedProduct && (
        <div className="bg-white border-t border-gray-200 px-4 py-2">
          <div className="flex items-center gap-2">
            {selectedProduct.images?.[0] && (
              <img
                src={selectedProduct.images[0]}
                alt={selectedProduct.name}
                className="w-8 h-8 rounded object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">
                {selectedProduct.name}
              </p>
              <p className="text-xs text-gray-500">৳{selectedProduct.price.toLocaleString()}</p>
            </div>
            <button
              onClick={() => setSelectedProduct(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <ChatInput
          onSend={handleSend}
          placeholder="Reply to customer..."
          disabled={sending}
        />
        <button
          onClick={handleOpenProductPicker}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          title="Attach product"
        >
          <ShoppingBag className="h-5 w-5" />
        </button>
      </div>

      {/* Product Picker Modal */}
      {showProductPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-900">Select Product</h3>
              <button
                onClick={() => setShowProductPicker(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 border-b">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {filteredProducts.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No products found</p>
              ) : (
                <div className="space-y-2">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleSelectProduct(product)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                          <ShoppingBag className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {product.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          ৳{product.price.toLocaleString()}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
