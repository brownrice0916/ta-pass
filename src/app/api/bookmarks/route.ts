// app/api/bookmarks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// POST - 북마크 추가
export async function POST(req: NextRequest) {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // userId 가져오기
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 요청 데이터 파싱
    const { restaurantId } = await req.json();

    if (!restaurantId) {
      return NextResponse.json(
        { error: "Restaurant ID is required" },
        { status: 400 }
      );
    }

    // 식당 존재 확인
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    // 이미 북마크 되었는지 확인
    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_restaurantId: {
          userId: user.id,
          restaurantId,
        },
      },
    });

    if (existingBookmark) {
      return NextResponse.json(
        { message: "Restaurant already bookmarked" },
        { status: 200 }
      );
    }

    // 북마크 생성
    const bookmark = await prisma.bookmark.create({
      data: {
        userId: user.id,
        restaurantId,
      },
    });

    return NextResponse.json({ bookmark }, { status: 200 });
  } catch (error) {
    console.error("Error creating bookmark:", error);
    return NextResponse.json(
      { error: "Failed to create bookmark" },
      { status: 500 }
    );
  }
}

// GET - 사용자의 모든 북마크 가져오기
export async function GET(req: NextRequest) {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // userId 가져오기
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 사용자의 모든 북마크와 관련 식당 정보 가져오기
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: user.id },
      include: {
        restaurant: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(bookmarks);
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookmarks" },
      { status: 500 }
    );
  }
}
