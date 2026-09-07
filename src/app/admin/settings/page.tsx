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

    const baseClasses =
      "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent";

    return (
      <div key={field.key}>
        <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
        <div className="relative">
          {field.type === "select" ? (
            <select
              value={value}
              onChange={(e) => updateSetting(field.key, e.target.value)}
              className={baseClasses}
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
              className={baseClasses + " resize-none"}
            />
          ) : (
            <input
              type={inputType}
              value={value}
              onChange={(e) => updateSetting(field.key, e.target.value)}
              placeholder={field.placeholder}
              className={baseClasses + (isPassword ? " pr-10" : "")}
            />
          )}
          {isPassword && (
            <button
              type="button"
              onClick={() => togglePasswordVisibility(field.key)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
        {field.description && (
          <p className="mt-1 text-xs text-gray-500">{field.description}</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500">Admin panel settings</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Admin panel settings</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 -mx-4 sm:mx-0 px-4 sm:px-0">
        <nav className="flex gap-2 sm:gap-4 -mb-px overflow-x-auto pb-px scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setSaveMessage(null);
                setTestResult(null);
              }}
              className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.key
                  ? "border-black text-black"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {currentFields.map((field) => renderField(field))}
        </div>

        {/* Messages */}
        {saveMessage && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg ${
              saveMessage.success
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
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
            className={`flex items-center gap-2 p-3 rounded-lg ${
              testResult.success
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
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
            className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="flex items-center gap-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
