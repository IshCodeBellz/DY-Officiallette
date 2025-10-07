import { NextRequest, NextResponse } from "next/server";
import { CaptchaService } from "@/lib/server/captcha";

export async function POST(request: NextRequest) {
  try {
    const { token, provider, configKey = "default" } = await request.json();

    if (!token) {
      return NextResponse.json(
        { message: "CAPTCHA token is required" },
        { status: 400 }
      );
    }

    const context = {
      userAgent: request.headers.get("user-agent") || "unknown",
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      endpoint: "captcha-verify",
    };

    const verification = await CaptchaService.verifyCaptcha(
      token,
      context,
      configKey
    );

    if (!verification.success) {
      return NextResponse.json(
        {
          message: "CAPTCHA verification failed",
          errors: verification.errorCodes,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "CAPTCHA verified successfully",
      score: verification.score,
    });
  } catch (error) {
      console.error("Error:", error);
    console.error("CAPTCHA verification error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const configKey = searchParams.get("config") || "default";

    const config = CaptchaService.getClientConfig(configKey);

    return NextResponse.json({ config });
  } catch (error) {
      console.error("Error:", error);
    console.error("Failed to get CAPTCHA config:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
