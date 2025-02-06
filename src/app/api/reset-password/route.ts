import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs"; // 비밀번호 해시화를 위한 라이브러리

export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json();

    console.log("token", token);
    console.log("newPassword", newPassword);

    // 유효한 토큰인지 확인 (이 예제에서는 토큰을 user.id로 가정)
    const userId = parseInt(token, 10); // token을 Int로 변환
    const user = await prisma.user.findUnique({
      where: { id: userId }, // Int로 전달
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "유효하지 않은 토큰입니다." },
        { status: 400 }
      );
    }

    // 새 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 비밀번호 업데이트
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: "비밀번호가 성공적으로 재설정되었습니다.",
    });
  } catch (error) {
    // error가 null이 아닌지 확인하고 로깅
    const errorMessage =
      error instanceof Error
        ? error.message
        : "비밀번호 재설정 중 오류가 발생했습니다.";
    console.error("비밀번호 재설정 오류:", errorMessage);

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
