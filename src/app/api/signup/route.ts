import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

// GET 메서드 핸들러 수정
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "이메일이 필요합니다." },
        { status: 400 }
      );
    }

    console.log("이메일 중복 체크:", email); // 디버깅용

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    return NextResponse.json({
      success: true,
      exists: !!existingUser,
      message: existingUser
        ? "이미 사용 중인 이메일입니다."
        : "사용 가능한 이메일입니다.",
    });
  } catch (error) {
    console.error("이메일 체크 에러:", error);
    return NextResponse.json(
      {
        success: false,
        error: "이메일 확인 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // 이메일 인증 확인
    const verification = await prisma.emailVerification.findFirst({
      where: {
        email: data.email,
        verified: true,
      },
    });

    if (!verification) {
      return NextResponse.json(
        { success: false, error: "이메일 인증이 완료되지 않았습니다." },
        { status: 400 }
      );
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(data.password, 10); // 10은 salt rounds

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword, // 해싱된 비밀번호 저장
        name: data.name,
        country: data.country || "",
        gender: data.gender || "",
        birthYear: data.birthYear || "",
        birthMonth: data.birthMonth || "",
        birthDay: data.birthDay || "",
      },
    });

    // 성공 응답
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("회원가입 에러:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "회원가입 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      }
    );
  }
}
