import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";

const ADMIN_EMAILS = [
  "brownrice0916@gmail.com",
  "rice@naver.com",
  "dergelbefluss@gmail.com",
];

const GenerateSerialSchema = z.object({
  count: z.number().int().min(1).max(1000).default(1),
  type: z.string().default("standard"),
  expiresAt: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
});

function generateSerialNumber() {
  const part1 = crypto.randomBytes(2).toString("hex").toUpperCase();
  const part2 = crypto.randomBytes(2).toString("hex").toUpperCase();
  const part3 = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `${part1}-${part2}-${part3}`;
}

export async function GET(req: NextRequest) {
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

    const where: any = {};
    if (type) where.type = type;
    if (isUsedParam !== null) where.isUsed = isUsedParam === "true";

    const serialNumbers = await prisma.serialNumber.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

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

export async function POST(req: NextRequest) {
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
    const { count, type, metadata } = GenerateSerialSchema.parse(body);

    const now = new Date();
    const defaultExpiresAt = new Date(
      now.getTime() + 7 * 30 * 24 * 60 * 60 * 1000
    ); // 7개월 후

    const serialNumberData = Array.from({ length: count }, () => ({
      code: generateSerialNumber(),
      type,
      expiresAt: defaultExpiresAt,
      metadata: metadata || {},
    }));

    const existingCodes = await prisma.serialNumber.findMany({
      where: {
        code: { in: serialNumberData.map((data) => data.code) },
      },
      select: { code: true },
    });

    const existingCodesSet = new Set(existingCodes.map((e) => e.code));
    const uniqueSerialNumbers = serialNumberData.filter(
      (data) => !existingCodesSet.has(data.code)
    );

    await prisma.serialNumber.createMany({ data: uniqueSerialNumbers });

    const generatedSerialNumbers = await prisma.serialNumber.findMany({
      where: { code: { in: uniqueSerialNumbers.map((data) => data.code) } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      count: generatedSerialNumbers.length,
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

export async function DELETE(req: NextRequest) {
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

    const unusedSerialNumbers = await prisma.serialNumber.findMany({
      where: {
        id: { in: ids },
        isUsed: false,
      },
    });

    const unusedIds = unusedSerialNumbers.map((s) => s.id);

    await prisma.serialNumber.deleteMany({
      where: { id: { in: unusedIds } },
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
