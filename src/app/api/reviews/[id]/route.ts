// app/api/reviews/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.pathname.split("/")[3]; // Extract the `id` from the URL

  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const review = await prisma.review.findUnique({
    where: { id: id },
    include: {
      restaurant: true,
      user: { select: { id: true, name: true, image: true } },
    },
  });

  if (!review)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (String(review.user.id) !== String(session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ ...review, userId: review.user.id }); // userId 추가로 전달
}

export async function PUT(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.pathname.split("/")[3];
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const review = await prisma.review.findUnique({ where: { id: id } });

  if (!review)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (String(review.userId) !== String(session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.review.update({
    where: { id: id },
    data: {
      content: body.content,
      rating: body.rating,
      images: body.images, // ✅ 이미지 배열 반영
      updatedAt: new Date(),
      tags: body.tags, // 추가
    },
    include: {
      restaurant: true,
      user: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json({ ...updated, userId: updated.user.id });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.pathname.split("/")[3];
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const review = await prisma.review.findUnique({ where: { id: id } });

  if (!review)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (String(review.userId) !== String(session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.review.delete({ where: { id: id } });

  return NextResponse.json({ success: true });
}
