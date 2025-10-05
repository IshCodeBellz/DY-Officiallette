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

    const addressId = params.id;

    // Verify the address belongs to the user
    const addressToDelete = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId: user.id,
      },
    });

    if (!addressToDelete) {
      return NextResponse.json(
        { error: "Address not found or doesn't belong to user" },
        { status: 404 }
      );
    }

    // If this is the default address and there are other addresses,
    // we need to set another address as default
    if (addressToDelete.isDefault) {
      // Find another address to set as default
      const otherAddress = await prisma.address.findFirst({
        where: {
          userId: user.id,
          id: { not: addressId },
        },
        orderBy: { createdAt: "asc" }, // Pick the oldest one
      });

      // Use a transaction to ensure atomicity
      await prisma.$transaction(async (tx) => {
        // Delete the address
        await tx.address.delete({
          where: { id: addressId },
        });

        // If there's another address, set it as default
        if (otherAddress) {
          await tx.address.update({
            where: { id: otherAddress.id },
            data: { isDefault: true },
          });
        }
      });
    } else {
      // Simply delete the address if it's not default
      await prisma.address.delete({
        where: { id: addressId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting address:", error);
    return NextResponse.json(
      { error: "Failed to delete address" },
      { status: 500 }
    );
  }
}
