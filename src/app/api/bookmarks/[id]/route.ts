// app/api/bookmarks/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE - 북마크 삭제
export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.pathname.split("/")[3];
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

    await prisma.bookmark.delete({
      where: {
        id: id, // 여기는 진짜 북마크 id가 와야 함
      },
    });

    return NextResponse.json(
      { message: "Bookmark removed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error removing bookmark:", error);
    return NextResponse.json(
      { error: "Failed to remove bookmark" },
      { status: 500 }
    );
  }
}

// GET - 식당이 사용자에 의해 북마크 되었는지 확인
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.pathname.split("/")[3];
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

    const restaurantId = id;

    // 북마크 확인
    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_restaurantId: {
          userId: user.id,
          restaurantId,
        },
      },
    });

    return NextResponse.json({
      isBookmarked: !!bookmark,
      bookmark,
    });
  } catch (error) {
    console.error("Error checking bookmark status:", error);
    return NextResponse.json(
      { error: "Failed to check bookmark status" },
      { status: 500 }
    );
  }
}
