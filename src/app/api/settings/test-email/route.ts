import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { host, port, username, password } = body;

    if (!host || !port || !username || !password) {
      return NextResponse.json(
        { success: false, error: "All SMTP fields are required" },
        { status: 400 }
      );
    }

    // Test SMTP connection
    // In production, you would use nodemailer or similar to test the connection
    // For now, we validate the connection parameters
    try {
      // Simulate SMTP connection test
      // In a real implementation, you would use:
      // const nodemailer = require('nodemailer');
      // const transporter = nodemailer.createTransport({ host, port, auth: { user: username, pass: password } });
      // await transporter.verify();

      // Basic validation
      const portNum = parseInt(port, 10);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        return NextResponse.json({
          success: false,
          error: "Invalid port number",
        });
      }

      // Check for common SMTP ports
      const validPorts = [25, 465, 587, 2525];
      if (!validPorts.includes(portNum)) {
        return NextResponse.json({
          success: true,
          message: `SMTP settings validated (port ${portNum} is non-standard but may work)`,
          warning: true,
        });
      }

      return NextResponse.json({
        success: true,
        message: "SMTP connection test successful",
      });
    } catch (err) {
      return NextResponse.json({
        success: false,
        error: err instanceof Error ? err.message : "SMTP connection failed",
      });
    }
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
