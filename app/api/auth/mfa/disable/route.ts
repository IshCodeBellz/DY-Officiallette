import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/server/authOptions";
import { MFAService } from "@/lib/server/mfa";
import { captureError } from "@/lib/server/errors";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const disableSchema = z.object({
  confirmationToken: z.string().min(6), // Require MFA token to disable
  reason: z.string().optional(),
});

/**
 * Disable MFA for the authenticated user
 * POST /api/auth/mfa/disable
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { confirmationToken, reason } = disableSchema.parse(body);

    // First verify the user can disable MFA with their current token
    const verifyResult = await MFAService.verifyMFA(
      session.user.email,
      confirmationToken
    );

    if (!verifyResult.success) {
      return NextResponse.json(
        {
          error:
            "Invalid verification code. MFA token required to disable MFA.",
          success: false,
        },
        { status: 400 }
      );
    }

    // Disable MFA
    await MFAService.disableMFA(session.user.email);

    // Log security event
    console.log(`MFA disabled for user ${session.user.email}`, {
      reason: reason || "User requested",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: {
        message: "MFA has been successfully disabled for your account",
        disabled: true,
      },
    });
  } catch (error) {
    console.error("MFA disable error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to disable MFA",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
