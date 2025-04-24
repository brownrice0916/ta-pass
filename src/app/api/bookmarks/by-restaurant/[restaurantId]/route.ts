import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// 예: /api/bookmarks/by-restaurant/[restaurantId]/route.ts
export async function GET(
  req: NextRequest,
  { params }: { params: { restaurantId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email as string },
  });

  const bookmark = await prisma.bookmark.findUnique({
    where: {
      userId_restaurantId: {
        userId: user!.id,
        restaurantId: params.restaurantId,
      },
    },
  });

  return NextResponse.json({
    isBookmarked: !!bookmark,
    bookmark,
  });
}
