import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/server/authOptions";
import { MFAService } from "@/lib/server/mfa";
import { captureError } from "@/lib/server/errors";

/**
 * Setup MFA for the authenticated user
 * POST /api/auth/mfa/setup
 */
export async function POST(request: NextRequest) {
  let session;
  try {
    session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Setup TOTP MFA
    const setupResult = await MFAService.setupTOTP(
      session.user.id,
      "ASOS Clone"
    );

    return NextResponse.json({
      success: true,
      data: {
        qrCodeUrl: setupResult.qrCodeUrl,
        backupCodes: setupResult.backupCodes,
        // Don't return the secret to the client
        message:
          "Scan the QR code with your authenticator app, then verify with a code to complete setup",
      },
    });
  } catch (error) {
    console.error("MFA setup error:", error);
    captureError(error as Error, {
      userId: session?.user?.id,
    });

    return NextResponse.json(
      {
        error: "Failed to setup MFA",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Get MFA status for the authenticated user
 * GET /api/auth/mfa/setup
 */
export async function GET(request: NextRequest) {
  let session;
  try {
    session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const mfaStatus = await MFAService.getMFAStatus(session.user.id);

    return NextResponse.json({
      success: true,
      data: mfaStatus,
    });
  } catch (error) {
    console.error("MFA status error:", error);
    captureError(error as Error, {
      userId: session?.user?.id,
    });

    return NextResponse.json(
      {
        error: "Failed to get MFA status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
