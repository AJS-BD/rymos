"use client";

import { useState, useEffect } from "react";
import { getAdminAuthHeaders } from "@/lib/admin-session";
import {
  Store,
  MessageSquare,
  Mail,
  CreditCard,
  Save,
  TestTube,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
} from "lucide-react";

type TabKey = "store" | "whatsapp" | "email" | "payment";

interface SettingField {
  key: string;
  label: string;
  type: "text" | "password" | "select" | "textarea" | "number";
  placeholder?: string;
  description?: string;
  options?: { value: string; label: string }[];
}

interface SettingsMap {
  [key: string]: string;
}

const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "store", label: "Store Settings", icon: <Store className="w-4 h-4" /> },
  { key: "whatsapp", label: "WhatsApp", icon: <MessageSquare className="w-4 h-4" /> },
  { key: "email", label: "Email (SMTP)", icon: <Mail className="w-4 h-4" /> },
  { key: "payment", label: "In-Store Payments", icon: <CreditCard className="w-4 h-4" /> },
];

const storeFields: SettingField[] = [
  { key: "store_name", label: "Store Name", type: "text", placeholder: "RYmos" },
  {
    key: "store_currency",
    label: "Currency",
    type: "select",
    options: [
      { value: "BDT", label: "Bangladeshi Taka (৳)" },
      { value: "USD", label: "US Dollar ($)" },
      { value: "EUR", label: "Euro (€)" },
      { value: "GBP", label: "British Pound (£)" },
      { value: "INR", label: "Indian Rupee (₹)" },
    ],
  },
  { key: "store_address", label: "Address", type: "textarea", placeholder: "123 Main St, Dhaka, Bangladesh" },
  { key: "store_phone", label: "Phone", type: "text", placeholder: "+880 1XXX-XXXXXX" },
  { key: "store_email", label: "Contact Email", type: "text", placeholder: "support@rymos.com" },
];

const whatsappFields: SettingField[] = [
  {
    key: "whatsapp_provider",
    label: "API Provider",
    type: "select",
    options: [
      { value: "meta", label: "Meta WhatsApp Business API" },
      { value: "twilio", label: "Twilio" },
      { value: "ultramsg", label: "UltraMsg" },
      { value: "dialog360", label: "360dialog" },
    ],
  },
  { key: "whatsapp_api_key", label: "API Key", type: "password", placeholder: "Enter your WhatsApp API key" },
  { key: "whatsapp_sender_phone", label: "Sender Phone Number", type: "text", placeholder: "+880 1XXX-XXXXXX" },
  {
    key: "whatsapp_message_template",
    label: "Order Message Template",
    type: "textarea",
    placeholder: "Hi {customer_name}, your order #{order_id} has been confirmed. Total: {total} {currency}",
    description: "Variables: {customer_name}, {order_id}, {total}, {currency}, {status}",
  },
];

const emailFields: SettingField[] = [
  { key: "smtp_host", label: "SMTP Host", type: "text", placeholder: "smtp.gmail.com" },
  { key: "smtp_port", label: "SMTP Port", type: "number", placeholder: "587" },
  { key: "smtp_username", label: "Username", type: "text", placeholder: "your-email@gmail.com" },
  { key: "smtp_password", label: "Password", type: "password", placeholder: "Enter SMTP password" },
  { key: "smtp_from_email", label: "From Email", type: "text", placeholder: "noreply@yourstore.com" },
  { key: "smtp_from_name", label: "From Name", type: "text", placeholder: "RYmos Store" },
];

const paymentFields: SettingField[] = [
  {
    key: "payment_gateway",
    label: "Payment Gateway",
    type: "select",
    description:
      "Only chooses which credentials a connection test checks. No online checkout is enabled.",
    options: [
      { value: "stripe", label: "Stripe" },
      { value: "bkash", label: "bKash" },
      { value: "nagad", label: "Nagad" },
    ],
  },
  { key: "stripe_secret_key", label: "Stripe Secret Key", type: "password", placeholder: "sk_live_...", description: "Not used — RYmos takes no online payments." },
  { key: "stripe_publishable_key", label: "Stripe Publishable Key", type: "text", placeholder: "pk_live_...", description: "Not used — RYmos takes no online payments." },
  { key: "stripe_webhook_secret", label: "Stripe Webhook Secret", type: "password", placeholder: "whsec_...", description: "Not used — RYmos takes no online payments." },
  { key: "bkash_api_key", label: "bKash App Key", type: "text", placeholder: "bKash App Key", description: "In-store / manual payment only — not used for online checkout." },
  { key: "bkash_app_secret", label: "bKash App Secret", type: "password", placeholder: "bKash App Secret", description: "In-store / manual payment only — not used for online checkout." },
  { key: "bkash_username", label: "bKash Username", type: "text", placeholder: "bKash merchant username", description: "In-store / manual payment only — not used for online checkout." },
  { key: "bkash_password", label: "bKash Password", type: "password", placeholder: "bKash merchant password", description: "In-store / manual payment only — not used for online checkout." },
  { key: "nagad_merchant_id", label: "Nagad Merchant ID", type: "text", placeholder: "Nagad Merchant ID", description: "In-store / manual payment only — not used for online checkout." },
  { key: "nagad_api_key", label: "Nagad API Key", type: "password", placeholder: "Nagad API Key", description: "In-store / manual payment only — not used for online checkout." },
];

const categoryMap: Record<TabKey, string> = {
  store: "store",
  whatsapp: "whatsapp",
  email: "email",
  payment: "payment",
};

const fieldsMap: Record<TabKey, SettingField[]> = {
  store: storeFields,
  whatsapp: whatsappFields,
  email: emailFields,
  payment: paymentFields,
};

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<TabKey>("store");
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<TabKey | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ success: boolean; message: string } | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        // /api/settings returns secret categories (whatsapp/email/payment)
        // only to admins — send the session token; without it only the
        // public store rows come back.
        const res = await fetch("/api/settings", {
          headers: await getAdminAuthHeaders(),
        });
        if (res.ok) {
          const { data } = await res.json();
          const settingsMap: SettingsMap = {};
          data?.forEach((item: { key: string; value: string | null }) => {
            if (item.value !== null) {
              settingsMap[item.key] = item.value;
            }
          });
          setSettings(settingsMap);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const fields = fieldsMap[activeTab];
      const updates: SettingsMap = {};
      fields.forEach((field) => {
        if (settings[field.key] !== undefined) {
          updates[field.key] = settings[field.key];
        }
      });

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getAdminAuthHeaders()),
        },
        body: JSON.stringify({
          settings: updates,
          category: categoryMap[activeTab],
        }),
      });

      if (res.ok) {
        setSaveMessage({ success: true, message: "Settings saved successfully!" });
      } else {
        const error = await res.json();
        setSaveMessage({ success: false, message: error.error || "Failed to save settings" });
      }
    } catch {
      setSaveMessage({ success: false, message: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(activeTab);
    setTestResult(null);

    try {
      // Map the stored settings keys to the field names each test route
      // expects. (Previously the raw settings keys were sent, which none
      // of the routes accepted, so every test failed at validation.)
      let endpoint = "";
      let body: Record<string, string> = {};

      if (activeTab === "whatsapp") {
        endpoint = "/api/settings/test-whatsapp";
        body = {
          provider: settings.whatsapp_provider || "",
          apiKey: settings.whatsapp_api_key || "",
          senderPhone: settings.whatsapp_sender_phone || "",
        };
      } else if (activeTab === "payment") {
        const gateway = settings.payment_gateway || "";
        if (gateway === "nagad") {
          // No Nagad API check is implemented — report that honestly
          // instead of calling an endpoint that would fake success.
          setTestResult({
            success: false,
            message:
              "Nagad connection test is not available — no Nagad API check is implemented. Nagad is accepted only as an in-store / manual payment.",
          });
          setTesting(null);
          return;
        }
        endpoint = "/api/settings/test-payment";
        body = { gateway };
        if (gateway === "stripe") {
          body.secretKey = settings.stripe_secret_key || "";
        } else if (gateway === "bkash") {
          body.username = settings.bkash_username || "";
          body.password = settings.bkash_password || "";
          body.appKey = settings.bkash_api_key || "";
          body.appSecret = settings.bkash_app_secret || "";
        }
      } else {
        setTestResult({ success: false, message: "No test available for this section" });
        setTesting(null);
        return;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await res.json();
      setTestResult({
        success: result.success,
        message: result.message || result.error || "Test completed",
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : "Test failed",
      });
    } finally {
      setTesting(null);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderField = (field: SettingField) => {
    const value = settings[field.key] || "";
    const isPassword = field.type === "password";
    const showPassword = showPasswords[field.key];
    const inputType = isPassword ? (showPassword ? "text" : "password") : field.type;

    return (
      <div key={field.key}>
        <label
          className="block text-[13px] font-medium mb-1.5"
          style={{ color: "var(--color-text)" }}
        >
          {field.label}
        </label>
        <div className="relative">
          {field.type === "select" ? (
            <select
              value={value}
              onChange={(e) => updateSetting(field.key, e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none transition-all"
              style={{
                border: "1px solid #e5e5e7",
                color: "var(--color-text)",
                background: "var(--color-bg)",
              }}
            >
              <option value="">Select {field.label}</option>
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : field.type === "textarea" ? (
            <textarea
              value={value}
              onChange={(e) => updateSetting(field.key, e.target.value)}
              placeholder={field.placeholder}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none transition-all resize-none"
              style={{
                border: "1px solid #e5e5e7",
                color: "var(--color-text)",
                background: "var(--color-bg)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#0071E3";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,113,227,0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#e5e5e7";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          ) : (
            <input
              type={inputType}
              value={value}
              onChange={(e) => updateSetting(field.key, e.target.value)}
              placeholder={field.placeholder}
              className={`w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none transition-all ${
                isPassword ? "pr-10" : ""
              }`}
              style={{
                border: "1px solid #e5e5e7",
                color: "var(--color-text)",
                background: "var(--color-bg)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#0071E3";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,113,227,0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#e5e5e7";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          )}
          {isPassword && (
            <button
              type="button"
              onClick={() => togglePasswordVisibility(field.key)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: "var(--color-text-muted)" }}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
        {field.description && (
          <p className="mt-1.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
            {field.description}
          </p>
        )}
      </div>
    );
  };

  const currentFields = fieldsMap[activeTab];
  // Only WhatsApp and In-Store Payments have a real connection test.
  // The email test was removed: it only validated the port number and
  // never connected to an SMTP server.
  const hasTest = activeTab === "whatsapp" || activeTab === "payment";

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight" style={{ color: "var(--color-text)" }}>
            Settings
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>Admin panel settings</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--color-text-muted)" }} />
          <span className="ml-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
            Loading settings...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight" style={{ color: "var(--color-text)" }}>
          Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>Admin panel settings</p>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid #e5e5e7" }} className="-mx-4 sm:mx-0 px-4 sm:px-0">
        <nav className="flex gap-1 sm:gap-2 -mb-px overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setSaveMessage(null);
                setTestResult(null);
              }}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2.5 text-xs sm:text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap"
              style={{
                borderColor: activeTab === tab.key ? "#0071E3" : "transparent",
                color: activeTab === tab.key ? "#0071E3" : "var(--color-text-muted)",
              }}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div
        className="rounded-2xl p-5 sm:p-6 space-y-5"
        style={{ background: "var(--color-bg)", border: "1px solid #e5e5e7" }}
      >
        {activeTab === "payment" && (
          <div
            className="p-3.5 rounded-lg text-sm"
            style={{ background: "#fff8e1", color: "#7a5c00", border: "1px solid #ffe082" }}
          >
            RYmos takes no online payments. Orders are paid by cash on
            delivery, or in store with bKash, Nagad, Rocket or card. The
            connection test below only verifies credentials — it does not
            enable online checkout.
          </div>
        )}
        {activeTab === "email" && (
          <div
            className="p-3.5 rounded-lg text-sm"
            style={{ background: "#fff8e1", color: "#7a5c00", border: "1px solid #ffe082" }}
          >
            The app does not send email yet — no order or notification emails
            are sent. These SMTP details are stored but unused, and there is
            no connection test for them.
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentFields.map((field) => renderField(field))}
        </div>

        {/* Messages */}
        {saveMessage && (
          <div
            className="flex items-center gap-2 p-3.5 rounded-lg"
            style={{
              background: saveMessage.success ? "#e8f5e9" : "#ffebee",
              color: saveMessage.success ? "#2e7d32" : "#c62828",
              border: `1px solid ${saveMessage.success ? "#c8e6c9" : "#ffcdd2"}`,
            }}
          >
            {saveMessage.success ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            <span className="text-sm">{saveMessage.message}</span>
          </div>
        )}

        {testResult && (
          <div
            className="flex items-center gap-2 p-3.5 rounded-lg"
            style={{
              background: testResult.success ? "#e8f5e9" : "#ffebee",
              color: testResult.success ? "#2e7d32" : "#c62828",
              border: `1px solid ${testResult.success ? "#c8e6c9" : "#ffcdd2"}`,
            }}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            <span className="text-sm">{testResult.message}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "#0071E3" }}
            onMouseEnter={(e) => !saving && (e.currentTarget.style.background = "#0077ed")}
            onMouseLeave={(e) => !saving && (e.currentTarget.style.background = "#0071E3")}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving..." : "Save Settings"}
          </button>

          {hasTest && (
            <button
              type="button"
              onClick={handleTest}
              disabled={testing !== null}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                border: "1px solid #e5e5e7",
                color: "var(--color-text)",
                background: "var(--color-bg)",
              }}
            >
              {testing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <TestTube className="w-4 h-4" />
              )}
              {testing ? "Testing..." : "Test Connection"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
