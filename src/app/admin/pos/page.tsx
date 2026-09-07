"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabase, isConfigured } from "@/lib/supabase";
import { Search, ShoppingCart, X, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, User, Phone, QrCode, MessageCircle, Mail } from "lucide-react";
import QRCode from 'qrcode';

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  stock: number;
  specs: any;
  images: string[];
  category: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface CustomerResult {
  id: string;
  full_name: string;
  phone: string;
  profile_completed: boolean;
  created_via?: string;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showCheckout, setShowCheckout] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [orderNumber, setOrderNumber] = useState("");
  const [createdCustomer, setCreatedCustomer] = useState<CustomerResult | null>(null);
  const [profileToken, setProfileToken] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [profileUrl, setProfileUrl] = useState<string>("");

  useEffect(() => {
    async function loadProducts() {
      if (!isConfigured()) return;
      const supabase = getSupabase();
      const { data } = await supabase.from("products").select("*").order("name");
      if (data) {
        setProducts(data);
        setFilteredProducts(data);
      }
    }
    loadProducts();
  }, []);

  useEffect(() => {
    let filtered = products;
    if (selectedCategory !== "all") {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredProducts(filtered);
  }, [products, searchQuery, selectedCategory]);

  const categories = [...new Set(products.map(p => p.category))];

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const formatBDT = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount).replace('BDT', '৳');
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    if (!isConfigured()) {
      alert("Supabase not configured");
      return;
    }

    const supabase = getSupabase();

    // Generate order number
    const newOrderNumber = `RY-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
    setOrderNumber(newOrderNumber);

    // Create customer if name and phone provided
    let customerData: CustomerResult | null = null;
    let token: string | null = null;

    if (customerName && customerPhone) {
      try {
        const res = await fetch('/api/customers/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ full_name: customerName, phone: customerPhone }),
        });
        const data = await res.json();
        if (data.customer) {
          customerData = data.customer;
          setCreatedCustomer(data.customer);
          if (data.created && data.profileToken) {
            token = data.profileToken;
            setProfileToken(data.profileToken);
            const url = `${window.location.origin}/complete-profile/${data.profileToken}`;
            setProfileUrl(url);
            // Generate QR code
            const qrDataUrl = await QRCode.toDataURL(url, {
              width: 200,
              margin: 2,
              color: { dark: '#000000', light: '#ffffff' },
            });
            setQrCodeDataUrl(qrDataUrl);
          }
        }
      } catch (err) {
        console.error('Error creating customer:', err);
      }
    }

    // Create order
    const { error } = await supabase.from("orders").insert({
      order_number: newOrderNumber,
      customer_id: customerData?.id || null,
      status: "confirmed",
      order_type: "pos",
      items: cart.map(item => ({
        product_id: item.product.id,
        name: item.product.name,
        qty: item.quantity,
        price: item.product.price,
      })),
      subtotal: subtotal,
      total: subtotal,
      payment_method: paymentMethod,
    });

    if (error) {
      alert("Error creating order: " + error.message);
      return;
    }

    // Update stock
    for (const item of cart) {
      await supabase
        .from("products")
        .update({ stock: item.product.stock - item.quantity })
        .eq("id", item.product.id);
    }

    setCart([]);
    setShowCheckout(false);
    setShowReceipt(true);
  };

  const resetForm = () => {
    setShowReceipt(false);
    setCustomerName("");
    setCustomerPhone("");
    setCreatedCustomer(null);
    setProfileToken(null);
    setQrCodeDataUrl("");
    setProfileUrl("");
    setOrderNumber("");
  };

  const whatsappLink = profileUrl
    ? `https://wa.me/?text=${encodeURIComponent(`Complete your profile at RYmos: ${profileUrl}`)}`
    : '';

  const emailLink = profileUrl
    ? `mailto:?subject=${encodeURIComponent('Complete Your RYmos Profile')}&body=${encodeURIComponent(`Please complete your profile at RYmos by visiting: ${profileUrl}`)}`
    : '';

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)]">
      {/* Products Section */}
      <div className="flex-1 p-4 lg:p-6 overflow-auto pb-20 lg:pb-6">
        <div className="mb-4 lg:mb-6">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900">POS</h1>
          <p className="text-gray-500 text-sm">Point of Sale System</p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 lg:mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="p-2 sm:p-4 bg-white rounded-lg border hover:shadow-md transition-shadow text-left"
            >
              <div className="aspect-square bg-gray-100 rounded-lg mb-2 sm:mb-3 flex items-center justify-center">
                <Smartphone className="h-8 w-8 sm:h-12 sm:w-12 text-gray-300" />
              </div>
              <h3 className="font-medium text-xs sm:text-sm text-gray-900 truncate">{product.name}</h3>
              <p className="text-xs text-gray-500">{product.brand}</p>
              <div className="flex items-center justify-between mt-1 sm:mt-2">
                <span className="font-bold text-xs sm:text-sm">{formatBDT(product.price)}</span>
                <span className="text-xs text-gray-400">{product.stock} left</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart Section - Desktop sidebar / Mobile bottom sheet */}
      <div className="fixed lg:relative bottom-0 left-0 right-0 lg:inset-auto lg:w-96 bg-white border-t lg:border-l lg:border-t-0 flex flex-col z-30 max-h-[50vh] lg:max-h-none shadow-lg lg:shadow-none transition-all">
        {/* Cart Header - Mobile Toggle */}
        <div
          className="lg:hidden p-3 border-b flex items-center justify-between cursor-pointer bg-gray-50"
          onClick={() => setShowMobileCart(!showMobileCart)}
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <span className="font-semibold text-gray-900">Cart ({itemCount})</span>
          </div>
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <span className="font-bold text-sm">{formatBDT(subtotal)}</span>
            )}
            <button className="p-1 text-gray-500">
              {showMobileCart ? '▼' : '▲'}
            </button>
          </div>
        </div>

        <div className="hidden lg:flex p-4 border-b items-center justify-between">
          <h2 className="font-semibold text-gray-900">Cart ({itemCount})</h2>
          {cart.length > 0 && (
            <button onClick={() => setCart([])} className="text-xs text-red-500 hover:text-red-700">
              Clear All
            </button>
          )}
        </div>

        {/* Cart Items */}
        <div className={`flex-1 overflow-auto p-3 sm:p-4 space-y-2 sm:space-y-3 ${showMobileCart ? 'block' : 'hidden lg:block'}`} style={{ maxHeight: showMobileCart ? '40vh' : undefined }}>
          {cart.length === 0 ? (
            <div className="text-center py-4 sm:py-8">
              <ShoppingCart className="h-8 w-8 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="flex gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                  <Smartphone className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs sm:text-sm truncate">{item.product.name}</p>
                  <p className="text-xs text-gray-500">{formatBDT(item.product.price)}</p>
                  <div className="flex items-center gap-1 sm:gap-2 mt-1">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-gray-200 flex items-center justify-center"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-xs sm:text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-gray-200 flex items-center justify-center"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="ml-auto text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-xs sm:text-sm">{formatBDT(item.product.price * item.quantity)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Summary */}
        {cart.length > 0 && (
          <div className="p-3 sm:p-4 border-t space-y-2 sm:space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-bold">{formatBDT(subtotal)}</span>
            </div>
            <button
              onClick={() => setShowCheckout(true)}
              className="w-full py-2 sm:py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors text-sm sm:text-base"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Checkout</h2>
              <button onClick={() => setShowCheckout(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="inline h-4 w-4 mr-1" />
                  Customer Name (optional)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="inline h-4 w-4 mr-1" />
                  Customer Phone (optional)
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+880 1XXX-XXXXXX"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "cash", label: "Cash", icon: Banknote },
                    { id: "card", label: "Card", icon: CreditCard },
                    { id: "mobile", label: "Mobile", icon: Smartphone },
                  ].map(method => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`p-3 rounded-lg border text-center transition-colors ${
                        paymentMethod === method.id
                          ? "border-black bg-gray-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <method.icon className="h-5 w-5 mx-auto mb-1" />
                      <span className="text-xs">{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between text-sm mb-2">
                  <span>Items</span>
                  <span>{itemCount}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatBDT(subtotal)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Complete Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Order Complete</h2>
              <button onClick={resetForm}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-center mb-4">
              <div className="text-green-500 text-4xl mb-2">✓</div>
              <p className="font-medium">Order {orderNumber}</p>
              <p className="text-sm text-gray-500">Total: {formatBDT(subtotal)}</p>
            </div>

            {createdCustomer && profileToken && (
              <div className="border-t pt-4 mt-4">
                <h3 className="font-medium text-sm mb-3 text-center">Customer Profile</h3>
                <p className="text-sm text-gray-600 text-center mb-3">
                  {createdCustomer.full_name} • {createdCustomer.phone}
                </p>

                {qrCodeDataUrl && (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="bg-white p-3 border rounded-lg">
                      <img src={qrCodeDataUrl} alt="Profile QR Code" className="w-40 h-40" />
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      Scan to complete your profile
                    </p>

                    <div className="flex gap-2 w-full">
                      {whatsappLink && (
                        <a
                          href={whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors"
                        >
                          <MessageCircle className="h-3 w-3" />
                          WhatsApp
                        </a>
                      )}
                      {emailLink && (
                        <a
                          href={emailLink}
                          className="flex-1 flex items-center justify-center gap-1 py-2 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors"
                        >
                          <Mail className="h-3 w-3" />
                          Email
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={resetForm}
              className="w-full mt-4 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              New Sale
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
