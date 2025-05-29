// src/app/api/bookmarks/log/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const restaurantId = body.restaurantId;

  if (!restaurantId) {
    return NextResponse.json(
      { error: "Missing restaurantId" },
      { status: 400 }
    );
  }

  try {
    await prisma.bookmarkLog.create({
      data: {
        restaurantId,
        userId: Number(session.user.id),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Bookmark log error:", error);
    return NextResponse.json(
      { error: "Failed to create bookmark log" },
      { status: 500 }
    );
  }
}
