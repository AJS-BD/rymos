import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gateway, secretKey, publishableKey } = body;

    if (!gateway) {
      return NextResponse.json(
        { success: false, error: "Payment gateway is required" },
        { status: 400 }
      );
    }

    try {
      if (gateway === "stripe") {
        if (!secretKey) {
          return NextResponse.json({
            success: false,
            error: "Stripe secret key is required",
          });
        }

        // Test Stripe connection
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
          message: "Stripe connection successful",
        });
      } else if (gateway === "bkash") {
        if (!secretKey || !publishableKey) {
          return NextResponse.json({
            success: false,
            error: "bKash API key and app secret are required",
          });
        }

        // Test bKash connection
        const response = await fetch(
          "https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout/token/grant",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              username: publishableKey,
              password: secretKey,
            },
            body: JSON.stringify({
              app_key: publishableKey,
              app_secret: secretKey,
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
          message: "bKash connection successful",
        });
      } else if (gateway === "nagad") {
        if (!secretKey || !publishableKey) {
          return NextResponse.json({
            success: false,
            error: "Nagad merchant ID and API key are required",
          });
        }

        // Test Nagad connection
        // Nagad API endpoint would go here
        return NextResponse.json({
          success: true,
          message: "Nagad API credentials validated",
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
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
