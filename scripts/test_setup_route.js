// Test harness for /api/setup/apply route logic (userland module via routeModule.userland).
// Loaded dynamically at runtime — a static import can't reach inside .next/server.
/* eslint-disable @typescript-eslint/no-require-imports */
const PORT = process.env.MOCK_PORT || "8991";
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  const u = String(url).replace("https://api.supabase.com", `http://127.0.0.1:${PORT}`);
  return realFetch(u, init);
};

async function main() {
  const m = require("/root/projects/rymos/.next/server/app/api/setup/apply/route.js");
  const route = m.routeModule.userland; // { POST }
  if (typeof route.POST !== "function") {
    console.error("POST export not found");
    process.exit(1);
  }

  // The userland POST expects a NextRequest-like object with .json()
  const call = async (body) => {
    const req = {
      json: async () => body,
      headers: new Map(),
      method: "POST",
      url: "http://localhost/api/setup/apply",
    };
    try {
      const res = await route.POST(req);
      const text = await res.text();
      let json = null;
      try { json = JSON.parse(text); } catch {}
      return { status: res.status, body: json ?? text };
    } catch (e) {
      return { status: -1, body: { harnessError: e.message } };
    }
  };

  const results = {};
  results.t1_missing_token = await call({});
  results.t2_invalid_token = await call({ token: "wrong-token" });
  results.t3_happy = await call({ token: "sbp_valid_token" });
  results.t4_repeat = await call({ token: "sbp_valid_token" });
  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => { console.error("HARNESS ERROR", e); process.exit(1); });
