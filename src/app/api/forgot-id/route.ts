// /app/api/forgot-id/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer"; // 이메일 전송을 위한 모듈

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // 이메일로 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "이메일에 해당하는 계정을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 이메일 전송 (비밀번호 재설정 링크 등)
    const transporter = nodemailer.createTransport({
      service: "gmail", // 이메일 서비스 제공자 (예시: Gmail)
      auth: {
        user: process.env.EMAIL_USER, // .env에 설정한 이메일 계정
        pass: process.env.EMAIL_PASS, // .env에 설정한 이메일 비밀번호
      },
    });

    const resetLink = `http://localhost:3000/reset-password?token=${user.id}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "비밀번호 재설정 요청",
      text: `비밀번호를 재설정하려면 아래 링크를 클릭하세요: ${resetLink}`,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: "비밀번호 재설정 링크가 이메일로 전송되었습니다.",
    });
  } catch (error) {
    console.error("계정 찾기 오류:", error);
    return NextResponse.json(
      { success: false, error: "계정 찾기 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
