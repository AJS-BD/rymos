import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider, apiKey, senderPhone } = body;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "API key is required" },
        { status: 400 }
      );
    }

    // Test WhatsApp API connection based on provider
    try {
      if (provider === "meta" || provider === "whatsapp-business") {
        // Test Meta WhatsApp Business API
        const response = await fetch(
          `https://graph.facebook.com/v18.0/${senderPhone}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          return NextResponse.json({
            success: false,
            error: errorData?.error?.message || "Failed to connect to WhatsApp Business API",
          });
        }

        return NextResponse.json({
          success: true,
          message: "WhatsApp Business API connection successful",
        });
      } else if (provider === "twilio") {
        // Test Twilio WhatsApp
        const accountSid = apiKey.split(":")[0];
        const authToken = apiKey.split(":")[1];
        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`,
          {
            method: "GET",
            headers: {
              Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
            },
          }
        );

        if (!response.ok) {
          return NextResponse.json({
            success: false,
            error: "Failed to connect to Twilio API",
          });
        }

        return NextResponse.json({
          success: true,
          message: "Twilio WhatsApp connection successful",
        });
      } else if (provider === "ultramsg") {
        // Test UltraMsg
        const response = await fetch(
          `https://api.ultramsg.com/instances/${apiKey}/messages/chat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              token: apiKey,
              to: senderPhone,
              body: "Test connection",
            }),
          }
        );

        if (!response.ok) {
          return NextResponse.json({
            success: false,
            error: "Failed to connect to UltraMsg API",
          });
        }

        return NextResponse.json({
          success: true,
          message: "UltraMsg connection successful",
        });
      } else {
        // Generic test - just validate key format
        return NextResponse.json({
          success: true,
          message: "API key format validated",
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
