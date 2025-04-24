import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// 시리얼 넘버 검증 스키마
const SerialNumberSchema = z.object({
  code: z.string().min(6).max(20),
});

// GET: 사용자의 등록된 시리얼 넘버 1개만 반환
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  try {
    const userId =
      typeof session.user.id === "string"
        ? parseInt(session.user.id)
        : session.user.id;

    const serialNumber = await prisma.serialNumber.findFirst({
      where: { userId: userId },
      orderBy: { usedAt: "desc" },
    });

    // 자동 비활성화 체크
    if (
      serialNumber?.activatedUntil &&
      new Date() > serialNumber.activatedUntil
    ) {
      await prisma.user.update({
        where: { id: userId },
        data: { membershipType: "free" },
      });
      return NextResponse.json([]); // 비활성화된 경우 null 처리
    }

    return NextResponse.json(serialNumber ? [serialNumber] : []);
  } catch (error) {
    console.error("시리얼 넘버 조회 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST: 시리얼 넘버 등록
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { code } = SerialNumberSchema.parse(body);

    const serialNumber = await prisma.serialNumber.findUnique({
      where: { code },
    });

    if (!serialNumber) {
      return NextResponse.json(
        { error: "유효하지 않은 시리얼 넘버입니다." },
        { status: 404 }
      );
    }

    if (serialNumber.isUsed) {
      return NextResponse.json(
        { error: "이미 사용된 시리얼 넘버입니다." },
        { status: 400 }
      );
    }

    if (serialNumber.expiresAt && new Date() > serialNumber.expiresAt) {
      return NextResponse.json(
        { error: "만료된 시리얼 넘버입니다." },
        { status: 400 }
      );
    }

    const userId =
      typeof session.user.id === "string"
        ? parseInt(session.user.id)
        : session.user.id;

    const now = new Date();
    const activatedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7일 후

    // 시리얼 넘버 사용 처리
    await prisma.serialNumber.update({
      where: { id: serialNumber.id },
      data: {
        isUsed: true,
        usedAt: now,
        userId: userId,
        activatedUntil,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        membershipType: serialNumber.type,
      },
    });

    return NextResponse.json({
      success: true,
      message: "시리얼 넘버가 성공적으로 등록되었습니다.",
      type: serialNumber.type,
      activatedAt: now,
      activatedUntil,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "유효하지 않은 입력입니다.", details: error.errors },
        { status: 400 }
      );
    }
    console.error("시리얼 넘버 등록 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
