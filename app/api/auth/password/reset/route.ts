import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { consumePasswordResetToken } from "@/lib/server/passwordReset";

const schema = z.object({ token: z.string().min(10), password: z.string().min(6).max(100) });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  const { token, password } = parsed.data;
  const result = await consumePasswordResetToken(token, password);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.reason }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
