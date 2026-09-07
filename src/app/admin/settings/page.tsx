"use client";

import { useState, useEffect, useCallback } from "react";
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
  { key: "payment", label: "Payment Gateway", icon: <CreditCard className="w-4 h-4" /> },
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
    options: [
      { value: "stripe", label: "Stripe" },
      { value: "bkash", label: "bKash" },
      { value: "nagad", label: "Nagad" },
    ],
  },
  { key: "stripe_secret_key", label: "Stripe Secret Key", type: "password", placeholder: "sk_live_..." },
  { key: "stripe_publishable_key", label: "Stripe Publishable Key", type: "text", placeholder: "pk_live_..." },
  { key: "stripe_webhook_secret", label: "Stripe Webhook Secret", type: "password", placeholder: "whsec_..." },
  { key: "bkash_api_key", label: "bKash App Key", type: "text", placeholder: "bKash App Key" },
  { key: "bkash_app_secret", label: "bKash App Secret", type: "password", placeholder: "bKash App Secret" },
  { key: "bkash_username", label: "bKash Username", type: "text", placeholder: "bKash merchant username" },
  { key: "bkash_password", label: "bKash Password", type: "password", placeholder: "bKash merchant password" },
  { key: "nagad_merchant_id", label: "Nagad Merchant ID", type: "text", placeholder: "Nagad Merchant ID" },
  { key: "nagad_api_key", label: "Nagad API Key", type: "password", placeholder: "Nagad API Key" },
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

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
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
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

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
        headers: { "Content-Type": "application/json" },
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
    } catch (err) {
      setSaveMessage({ success: false, message: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(activeTab);
    setTestResult(null);

    try {
      let endpoint = "";
      const fields = fieldsMap[activeTab];
      const body: Record<string, string> = {};

      fields.forEach((field) => {
        if (settings[field.key] !== undefined) {
          body[field.key] = settings[field.key];
        }
      });

      switch (activeTab) {
        case "whatsapp":
          endpoint = "/api/settings/test-whatsapp";
          break;
        case "email":
          endpoint = "/api/settings/test-email";
          break;
        case "payment":
          endpoint = "/api/settings/test-payment";
          break;
        default:
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
          className="block text-sm font-medium mb-1.5"
          style={{ color: "var(--color-text)" }}
        >
          {field.label}
        </label>
        <div className="relative">
          {field.type === "select" ? (
            <select
              value={value}
              onChange={(e) => updateSetting(field.key, e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
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
              className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all resize-none"
              style={{
                border: "1px solid #e5e5e7",
                color: "var(--color-text)",
                background: "var(--color-bg)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--color-primary)";
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
              className={`w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all ${
                isPassword ? "pr-10" : ""
              }`}
              style={{
                border: "1px solid #e5e5e7",
                color: "var(--color-text)",
                background: "var(--color-bg)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--color-primary)";
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
  const hasTest = activeTab !== "store";

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold" style={{ color: "var(--color-text)" }}>
            Settings
          </h1>
          <p style={{ color: "var(--color-text-muted)" }}>Admin panel settings</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--color-text-muted)" }} />
          <span className="ml-2" style={{ color: "var(--color-text-muted)" }}>
            Loading settings...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold" style={{ color: "var(--color-text)" }}>
          Settings
        </h1>
        <p style={{ color: "var(--color-text-muted)" }}>Admin panel settings</p>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid #e5e5e7" }} className="-mx-4 sm:mx-0 px-4 sm:px-0">
        <nav className="flex gap-2 sm:gap-4 -mb-px overflow-x-auto pb-px scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setSaveMessage(null);
                setTestResult(null);
              }}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0"
              style={{
                borderColor: activeTab === tab.key ? "var(--color-text)" : "transparent",
                color: activeTab === tab.key ? "var(--color-text)" : "var(--color-text-muted)",
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
        className="rounded-2xl p-5 sm:p-8 space-y-5 sm:space-y-6"
        style={{ background: "var(--color-bg)", border: "1px solid #e5e5e7" }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {currentFields.map((field) => renderField(field))}
        </div>

        {/* Messages */}
        {saveMessage && (
          <div
            className="flex items-center gap-2 p-4 rounded-xl"
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
            className="flex items-center gap-2 p-4 rounded-xl"
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
            style={{ background: "var(--color-text)" }}
            onMouseEnter={(e) => !saving && (e.currentTarget.style.background = "#333")}
            onMouseLeave={(e) => !saving && (e.currentTarget.style.background = "var(--color-text)")}
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
