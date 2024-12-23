import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
// next-auth의 authOptions 임포트
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// 로그인 시도 시
export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("로그인 시도:", data.email); // 이메일 로깅

    // 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    console.log("찾은 사용자:", user); // 사용자 데이터 로깅

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "이메일 또는 비밀번호가 일치하지 않습니다.",
        },
        { status: 401 }
      );
    }

    // 비밀번호 비교 과정 로깅
    console.log("입력된 비밀번호:", data.password);
    console.log("저장된 해시:", user.password);

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    console.log("비밀번호 일치 여부:", isPasswordValid);

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: "이메일 또는 비밀번호가 일치하지 않습니다.",
        },
        { status: 401 }
      );
    }

    // 세션 생성
    const session = await getServerSession(authOptions);
    console.log("session", session);
    if (session) {
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    }

    // 세션이 없으면 에러 응답
    return NextResponse.json(
      {
        success: false,
        error: "세션 생성 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  } catch (error) {
    console.error("로그인 에러:", error);
    return NextResponse.json(
      {
        success: false,
        error: "로그인 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
