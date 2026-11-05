import { NextRequest, NextResponse } from "next/server";

// Connection tests only. RYmos takes NO online payments — these endpoints
// only verify that stored credentials can reach the provider. They do not
// enable online checkout, and there is no Nagad test: no Nagad API check
// is implemented, so Nagad honestly reports as unavailable instead of
// returning a fake success.

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gateway } = body;

    if (!gateway) {
      return NextResponse.json(
        { success: false, error: "Payment gateway is required" },
        { status: 400 }
      );
    }

    try {
      if (gateway === "stripe") {
        const secretKey = body.secretKey as string | undefined;
        if (!secretKey) {
          return NextResponse.json({
            success: false,
            error: "Stripe secret key is required",
          });
        }

        // Real check: Stripe balance endpoint with the stored secret key.
        const response = await fetch("https://api.stripe.com/v1/balance", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${secretKey}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          return NextResponse.json({
            success: false,
            error: errorData?.error?.message || "Failed to connect to Stripe",
          });
        }

        return NextResponse.json({
          success: true,
          message:
            "Stripe connection successful (connection test only — not used for online checkout)",
        });
      } else if (gateway === "bkash") {
        const { username, password, appKey, appSecret } = body as {
          username?: string;
          password?: string;
          appKey?: string;
          appSecret?: string;
        };
        if (!username || !password || !appKey || !appSecret) {
          return NextResponse.json({
            success: false,
            error:
              "bKash merchant username, password, app key and app secret are required",
          });
        }

        // Real check: bKash token-grant call with the stored credentials.
        const response = await fetch(
          "https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout/token/grant",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              username,
              password,
            },
            body: JSON.stringify({
              app_key: appKey,
              app_secret: appSecret,
            }),
          }
        );

        if (!response.ok) {
          return NextResponse.json({
            success: false,
            error: "Failed to connect to bKash API",
          });
        }

        return NextResponse.json({
          success: true,
          message:
            "bKash connection successful (connection test only — not used for online checkout)",
        });
      } else if (gateway === "nagad") {
        return NextResponse.json({
          success: false,
          error:
            "Nagad connection test is not available — no Nagad API check is implemented. Nagad is accepted only as an in-store / manual payment.",
        });
      } else {
        return NextResponse.json({
          success: false,
          error: "Unknown payment gateway",
        });
      }
    } catch (err) {
      return NextResponse.json({
        success: false,
        error: err instanceof Error ? err.message : "Connection failed",
      });
    }
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
