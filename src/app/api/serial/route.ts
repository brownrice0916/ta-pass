import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// 시리얼 넘버 검증 스키마
const SerialNumberSchema = z.object({
  code: z.string().min(6).max(20),
});

// GET: 사용자의 등록된 시리얼 넘버 목록
export async function GET(req: NextRequest) {
  // 세션 확인 - 로그인한 사용자만 접근 가능
  console.log("✅ GET /api/serial reached");
  const session = await getServerSession(authOptions);

  console.log("Session:", session);

  if (!session || !session.user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  try {
    // session.user.id가 문자열인지 숫자인지 확인
    const userId =
      typeof session.user.id === "string"
        ? parseInt(session.user.id)
        : session.user.id;

    console.log("Looking for serialNumbers with userId:", userId);

    const serialNumbers = await prisma.serialNumber.findMany({
      where: { userId: userId },
      orderBy: { usedAt: "desc" },
    });

    console.log("Found serialNumbers:", serialNumbers);

    return NextResponse.json(serialNumbers);
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
  // 세션 확인 - 로그인한 사용자만 접근 가능
  console.log("✅ POST /api/serial reached");
  const session = await getServerSession(authOptions);

  console.log("Session:", session);

  if (!session || !session.user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    console.log("Request body:", body);

    const { code } = SerialNumberSchema.parse(body);

    // 시리얼 넘버 검색
    const serialNumber = await prisma.serialNumber.findUnique({
      where: { code },
    });

    console.log("Found serialNumber:", serialNumber);

    // 존재하지 않는 시리얼 넘버
    if (!serialNumber) {
      return NextResponse.json(
        { error: "유효하지 않은 시리얼 넘버입니다." },
        { status: 404 }
      );
    }

    // 이미 사용된 시리얼 넘버
    if (serialNumber.isUsed) {
      return NextResponse.json(
        { error: "이미 사용된 시리얼 넘버입니다." },
        { status: 400 }
      );
    }

    // 만료된 시리얼 넘버 체크
    if (serialNumber.expiresAt && new Date() > serialNumber.expiresAt) {
      return NextResponse.json(
        { error: "만료된 시리얼 넘버입니다." },
        { status: 400 }
      );
    }

    // session.user.id가 문자열인지 숫자인지 확인
    const userId =
      typeof session.user.id === "string"
        ? parseInt(session.user.id)
        : session.user.id;

    console.log("Updating serialNumber for userId:", userId);

    // 시리얼 넘버 사용 처리
    const updatedSerialNumber = await prisma.serialNumber.update({
      where: { id: serialNumber.id },
      data: {
        isUsed: true,
        usedAt: new Date(),
        userId: userId,
      },
    });

    // 사용자 등급 업데이트 (시리얼 넘버 타입에 따라)
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
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
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
