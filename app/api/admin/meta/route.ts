import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { withRequest } from "@/lib/server/logger";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/authOptions";

export const GET = withRequest(async function GET() {
  const session = await getServerSession(authOptions);
  const uid = (session?.user as any)?.id as string | undefined;
  if (!uid)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user?.isAdmin)
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const [brands, categories] = await Promise.all([
    prisma.brand.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);
  return NextResponse.json({ brands, categories });
});
