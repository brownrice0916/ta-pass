// app/api/account/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { User } from "@prisma/client";

// GET: 현재 로그인된 사용자 정보 조회
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "인증되지 않은 요청입니다." },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        email: true,
        name: true,
        country: true,
        gender: true,
        birthYear: true,
        birthMonth: true,
        birthDay: true,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("사용자 정보 조회 에러:", error);
    return NextResponse.json(
      { success: false, error: "사용자 정보 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PUT: 사용자 정보 수정
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "인증되지 않은 요청입니다." },
        { status: 401 }
      );
    }

    const data = await request.json();
    const updateData: Partial<User> = { ...data };

    // 비밀번호가 제공된 경우에만 해싱하여 업데이트
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    } else {
      delete updateData.password;
    }


    delete updateData.email;

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: updateData,
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("사용자 정보 수정 에러:", error);
    return NextResponse.json(
      { success: false, error: "사용자 정보 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
