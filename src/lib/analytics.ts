/**
 * Analytics helper for RYMOS e-commerce platform.
 * Console logs events for now — can integrate GA4, Plausible, or PostHog later.
 */

type EventName =
  | "page_view"
  | "product_view"
  | "add_to_cart"
  | "remove_from_cart"
  | "begin_checkout"
  | "purchase"
  | "search"
  | "wishlist_add"
  | "share";

interface EventProperties {
  [key: string]: string | number | boolean | undefined;
}

interface PageViewProperties extends EventProperties {
  path?: string;
  title?: string;
  referrer?: string;
}

interface ProductProperties extends EventProperties {
  product_id: string;
  product_name: string;
  category?: string;
  price?: number;
  currency?: string;
}

interface CartProperties extends EventProperties {
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  currency?: string;
}

// Check if we're in production
const isProduction = process.env.NODE_ENV === "production";

// Check if analytics is enabled (can be disabled for development)
const isAnalyticsEnabled = () => {
  if (typeof window === "undefined") return false;
  // Disable in development unless explicitly enabled
  if (!isProduction && process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== "true") {
    return false;
  }
  return true;
};

/**
 * Track a custom event
 */
export function trackEvent(name: EventName, properties?: EventProperties): void {
  if (!isAnalyticsEnabled()) {
    console.log(`[Analytics] Event: ${name}`, properties);
    return;
  }

  // Future: Send to GA4, Plausible, or PostHog
  // window.gtag?.("event", name, properties);
  // window.plausible?.(name, { properties });

  console.log(`[Analytics] Event: ${name}`, properties);
}

/**
 * Track page views
 */
export function trackPageView(properties?: PageViewProperties): void {
  if (typeof window === "undefined") return;

  const pageProps: PageViewProperties = {
    path: properties?.path ?? window.location.pathname,
    title: properties?.title ?? document.title,
    referrer: properties?.referrer ?? document.referrer,
  };

  trackEvent("page_view", pageProps);
}

/**
 * Track product views
 */
export function trackProductView(properties: ProductProperties): void {
  trackEvent("product_view", properties);
}

/**
 * Track add to cart events
 */
export function trackAddToCart(properties: CartProperties): void {
  trackEvent("add_to_cart", properties);
}

/**
 * Track remove from cart events
 */
export function trackRemoveFromCart(properties: CartProperties): void {
  trackEvent("remove_from_cart", properties);
}

/**
 * Track checkout initiation
 */
export function trackBeginCheckout(properties: {
  value: number;
  items: number;
  currency?: string;
}): void {
  trackEvent("begin_checkout", properties);
}

/**
 * Track purchases
 */
export function trackPurchase(properties: {
  transaction_id: string;
  value: number;
  items: number;
  currency?: string;
}): void {
  trackEvent("purchase", properties);
}

/**
 * Track search queries
 */
export function trackSearch(query: string): void {
  trackEvent("search", { query });
}

/**
 * Track wishlist additions
 */
export function trackWishlistAdd(properties: ProductProperties): void {
  trackEvent("wishlist_add", properties);
}

/**
 * Track social shares
 */
export function trackShare(properties: {
  method: string;
  content_type?: string;
  item_id?: string;
}): void {
  trackEvent("share", properties);
}

/**
 * Initialize analytics — call once in root layout or app component
 */
export function initAnalytics(): void {
  if (!isAnalyticsEnabled()) {
    console.log("[Analytics] Initialized (console-only mode)");
    return;
  }

  console.log("[Analytics] Initialized");

  // Future: Initialize GA4, Plaushtag, or PostHog here
  // const script = document.createElement("script");
  // script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  // script.async = true;
  // document.head.appendChild(script);
}

/**
 * User identification for analytics
 */
export function identifyUser(userId: string, traits?: Record<string, string | number>): void {
  if (!isAnalyticsEnabled()) {
    console.log(`[Analytics] Identify: ${userId}`, traits);
    return;
  }

  // Future: window.gtag?.("set", "user_id", userId);
  console.log(`[Analytics] Identify: ${userId}`, traits);
}

export default {
  trackEvent,
  trackPageView,
  trackProductView,
  trackAddToCart,
  trackRemoveFromCart,
  trackBeginCheckout,
  trackPurchase,
  trackSearch,
  trackWishlistAdd,
  trackShare,
  initAnalytics,
  identifyUser,
};
