import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/authOptions";
import { prisma } from "@/lib/server/prisma";
import { hashPassword } from "@/lib/server/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  const uid = (session?.user as any)?.id as string | undefined;
  if (!uid)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({
      where: { id: uid },
    });

    if (!user) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    // Get user preferences separately
    let preferences = null;
    try {
      preferences = await (prisma as any).userPreferences.findUnique({
        where: { userId: uid },
      });
    } catch (error) {
      console.log("Preferences not found or error:", error);
    }

    return NextResponse.json({
      ...user,
      preferences,
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const uid = (session?.user as any)?.id as string | undefined;
  if (!uid)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body)
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  try {
    // Handle comprehensive profile update
    if (body.action === "update_profile") {
      const updateData: any = {};

      // Handle name field
      if (typeof body.name === "string") {
        updateData.name = body.name.trim().slice(0, 100) || null;
      }

      // Handle firstName and lastName
      if (typeof body.firstName === "string") {
        updateData.firstName = body.firstName.trim().slice(0, 50) || null;
      }
      if (typeof body.lastName === "string") {
        updateData.lastName = body.lastName.trim().slice(0, 50) || null;
      }

      // Handle date of birth
      if (body.dateOfBirth) {
        try {
          updateData.dateOfBirth = new Date(body.dateOfBirth);
        } catch (e) {
          return NextResponse.json(
            { error: "Invalid date of birth format" },
            { status: 400 }
          );
        }
      }

      // Handle gender
      if (typeof body.gender === "string") {
        updateData.gender = body.gender.trim().slice(0, 50) || null;
      }

      await prisma.user.update({
        where: { id: uid },
        data: updateData,
      });
      return NextResponse.json({ ok: true });
    }

    // Handle password update
    if (body.action === "update_password") {
      const { newPassword } = body;
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters" },
          { status: 400 }
        );
      }

      const hashedPassword = await hashPassword(newPassword);
      await prisma.user.update({
        where: { id: uid },
        data: { passwordHash: hashedPassword },
      });
      return NextResponse.json({ ok: true });
    }

    // Handle contact preferences update
    if (body.action === "update_preferences") {
      const { contactPreferences } = body;
      if (!contactPreferences || typeof contactPreferences !== "object") {
        return NextResponse.json(
          { error: "Invalid contact preferences" },
          { status: 400 }
        );
      }

      // Upsert user preferences in the database
      await (prisma as any).userPreferences.upsert({
        where: { userId: uid },
        update: {
          emailMarketing: !!contactPreferences.email,
          postMarketing: !!contactPreferences.post,
          smsMarketing: !!contactPreferences.sms,
          thirdParty: !!contactPreferences.thirdParty,
        },
        create: {
          userId: uid,
          emailMarketing: !!contactPreferences.email,
          postMarketing: !!contactPreferences.post,
          smsMarketing: !!contactPreferences.sms,
          thirdParty: !!contactPreferences.thirdParty,
        },
      });
      return NextResponse.json({ ok: true });
    }

    // Handle account deletion
    if (body.action === "delete_account") {
      // Delete user and all related data
      await prisma.user.delete({
        where: { id: uid },
      });
      return NextResponse.json({
        ok: true,
        message: "Account deleted successfully",
      });
    }

    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 }
    );
  }
}
