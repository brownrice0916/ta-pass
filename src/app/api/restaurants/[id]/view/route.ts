// src/app/api/restaurants/[id]/view/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest, context: { params: any }) {
  const restaurantId = context.params.id;
  if (!restaurantId) {
    return NextResponse.json(
      { error: "Missing restaurant ID" },
      { status: 400 }
    );
  }

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ? Number(session.user.id) : undefined;

  const ipAddress =
    req.headers.get("x-forwarded-for") || req.headers.get("host") || "";
  const userAgent = req.headers.get("user-agent") || "";

  try {
    // 조회수 증가
    const updated = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });

    // 조회 로그 저장
    await prisma.restaurantViewLog.create({
      data: {
        restaurantId,
        userId,
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({ success: true, viewCount: updated.viewCount });
  } catch (error) {
    console.error("View error:", error);
    return NextResponse.json(
      { error: "Restaurant not found or failed to log view" },
      { status: 404 }
    );
  }
}
