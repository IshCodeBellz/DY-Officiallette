import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/authOptions";
import { prisma } from "@/lib/server/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin)
    return new NextResponse("Unauthorized", { status: 401 });
  const data = await req.json();
  // Allow partial update of mutable fields
  const updatable: any = {};
  for (const key of [
    "valueCents",
    "percent",
    "usageLimit",
    "minSubtotalCents",
    "startsAt",
    "endsAt",
  ]) {
    if (key in data) updatable[key] = data[key];
  }
  try {
    const updated = await prisma.discountCode.update({
      where: { id: params.id },
      data: updatable,
    });
    return NextResponse.json(updated);
  } catch (e) {
    return new NextResponse("Not Found", { status: 404 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin)
    return new NextResponse("Unauthorized", { status: 401 });
  try {
    await prisma.discountCode.delete({ where: { id: params.id } });
    return new NextResponse("", { status: 204 });
  } catch (e) {
    return new NextResponse("Not Found", { status: 404 });
  }
}
