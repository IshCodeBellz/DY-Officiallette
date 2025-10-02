import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { hashPassword } from "@/lib/server/auth";
import { z } from "zod";
import crypto from "crypto";
import { sendEmailVerification } from "@/lib/server/mailer";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }
    const { email, password, name } = parsed.data;
    const lower = email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: lower } });
    if (existing) {
      return NextResponse.json({ error: "email_exists" }, { status: 409 });
    }
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email: lower, passwordHash, name },
      select: { id: true, email: true },
    });

    // Generate verification token & store
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.emailVerificationToken.create({
      data: { userId: user.id, token, expiresAt },
    });
    const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verificationUrl = `${base}/verify-email/${token}`;
    await sendEmailVerification(user.email, user.id, verificationUrl);

    // Do NOT sign user in yet; require verification
    return NextResponse.json({
      status: "pending_verification",
      message: "Registration received. Please verify via email link.",
    });
  } catch (e) {
    console.error("[REGISTER:error]", e);
    return NextResponse.json({ error: "register_failed" }, { status: 500 });
  }
}
