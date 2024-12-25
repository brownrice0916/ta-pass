import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
// next-auth의 authOptions 임포트
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !await bcrypt.compare(data.password, user.password)) {
      return NextResponse.json(
        { success: false, error: "이메일 또는 비밀번호가 일치하지 않습니다." },
        { status: 401 }
      );
    }

    // 인증 성공 시 바로 사용자 정보 반환
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("로그인 에러:", error);
    return NextResponse.json(
      { success: false, error: "로그인 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}