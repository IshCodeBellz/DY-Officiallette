import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/authOptions";
import { prisma } from "@/lib/server/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { fullName, line1, line2, city, region, postalCode, country, phone } =
      body;

    // Validate required fields
    if (!fullName || !line1 || !city || !postalCode || !country) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if address belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existingAddress) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    const address = await prisma.address.update({
      where: { id: params.id },
      data: {
        fullName,
        line1,
        line2: line2 || null,
        city,
        region: region || null,
        postalCode,
        country,
        phone: phone || null,
      },
    });

    return NextResponse.json(address);
  } catch (error) {
    console.error("Error updating address:", error);
    return NextResponse.json(
      { error: "Failed to update address" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if address belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existingAddress) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    await prisma.address.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error("Error deleting address:", error);
    return NextResponse.json(
      { error: "Failed to delete address" },
      { status: 500 }
    );
  }
}
