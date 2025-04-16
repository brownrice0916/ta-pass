import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { z } from "zod";

// 관리자 목록 - 실제 구현에서는 DB에서 관리자 권한 확인
const ADMIN_EMAILS = ["brownrice0916@gmail.com"]; // 관리자 이메일 주소로 변경하세요

// 시리얼 넘버 생성 요청 스키마
const GenerateSerialSchema = z.object({
  count: z.number().int().min(1).max(1000).default(1),
  type: z.string().default("standard"),
  expiresAt: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
});

// 랜덤 시리얼 넘버 생성 함수
function generateSerialNumber() {
  // 포맷: XXXX-XXXX-XXXX (각 파트는 영문 대문자 + 숫자)
  const part1 = crypto.randomBytes(2).toString("hex").toUpperCase();
  const part2 = crypto.randomBytes(2).toString("hex").toUpperCase();
  const part3 = crypto.randomBytes(2).toString("hex").toUpperCase();

  return `${part1}-${part2}-${part3}`;
}

// GET: 모든 시리얼 넘버 목록 조회
export async function GET(req: NextRequest) {
  // 관리자 인증
  const session = await getServerSession(authOptions);

  if (
    !session ||
    !session.user ||
    !session.user.email ||
    !ADMIN_EMAILS.includes(session.user.email)
  ) {
    return NextResponse.json(
      { error: "관리자 권한이 필요합니다." },
      { status: 403 }
    );
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const type = searchParams.get("type") || undefined;
    const isUsedParam = searchParams.get("isUsed");

    const skip = (page - 1) * limit;

    // 필터 조건 구성
    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (isUsedParam !== null) {
      where.isUsed = isUsedParam === "true";
    }

    // 시리얼 넘버 조회 (페이지네이션 적용)
    const serialNumbers = await prisma.serialNumber.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    // 전체 갯수 조회
    const totalCount = await prisma.serialNumber.count({ where });

    return NextResponse.json({
      data: serialNumbers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("시리얼 넘버 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST: 시리얼 넘버 생성
export async function POST(req: NextRequest) {
  // 관리자 인증
  const session = await getServerSession(authOptions);

  if (
    !session ||
    !session.user ||
    !session.user.email ||
    !ADMIN_EMAILS.includes(session.user.email)
  ) {
    return NextResponse.json(
      { error: "관리자 권한이 필요합니다." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { count, type, expiresAt, metadata } =
      GenerateSerialSchema.parse(body);

    // 시리얼 넘버 생성
    const serialNumberData = Array.from({ length: count }, () => ({
      code: generateSerialNumber(),
      type,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      metadata: metadata || {},
    }));

    // 중복 방지를 위한 코드 검증
    const existingCodes = await prisma.serialNumber.findMany({
      where: {
        code: {
          in: serialNumberData.map((data) => data.code),
        },
      },
      select: { code: true },
    });

    const existingCodesSet = new Set(existingCodes.map((e) => e.code));

    // 중복이 없는 시리얼 넘버만 필터링
    const uniqueSerialNumbers = serialNumberData.filter(
      (data) => !existingCodesSet.has(data.code)
    );

    // 시리얼 넘버 일괄 생성
    const createdSerialNumbers = await prisma.serialNumber.createMany({
      data: uniqueSerialNumbers,
    });

    // 생성된 시리얼 넘버 조회
    const generatedSerialNumbers = await prisma.serialNumber.findMany({
      where: {
        code: {
          in: uniqueSerialNumbers.map((data) => data.code),
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      count: createdSerialNumbers.count,
      serialNumbers: generatedSerialNumbers,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "유효하지 않은 입력입니다.", details: error.errors },
        { status: 400 }
      );
    }
    console.error("시리얼 넘버 생성 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE: 시리얼 넘버 삭제 (미사용 상태일 때만)
export async function DELETE(req: NextRequest) {
  // 관리자 인증
  const session = await getServerSession(authOptions);

  if (
    !session ||
    !session.user ||
    !session.user.email ||
    !ADMIN_EMAILS.includes(session.user.email)
  ) {
    return NextResponse.json(
      { error: "관리자 권한이 필요합니다." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "삭제할 시리얼 넘버 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 미사용 상태인 시리얼 넘버만 필터링
    const unusedSerialNumbers = await prisma.serialNumber.findMany({
      where: {
        id: { in: ids },
        isUsed: false,
      },
    });

    const unusedIds = unusedSerialNumbers.map((s) => s.id);

    // 미사용 상태인 시리얼 넘버만 삭제
    await prisma.serialNumber.deleteMany({
      where: {
        id: { in: unusedIds },
      },
    });

    return NextResponse.json({
      success: true,
      deletedCount: unusedIds.length,
      skippedCount: ids.length - unusedIds.length,
    });
  } catch (error) {
    console.error("시리얼 넘버 삭제 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
