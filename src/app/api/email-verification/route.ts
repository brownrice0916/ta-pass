// /app/api/email-verification/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// 인증 코드 생성 함수
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6자리 코드
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "이미 사용 중인 이메일입니다." },
        { status: 400 }
      );
    }

    // 인증 코드 생성
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10분 후 만료

    // 기존 인증 코드가 있다면 삭제
    await prisma.emailVerification.deleteMany({
      where: { email },
    });

    // 새 인증 코드 저장
    await prisma.emailVerification.create({
      data: {
        email,
        code: verificationCode,
        expiresAt,
      },
    });

    // 이메일 전송
    const transporter = nodemailer.createTransport({
      service: "gmail", // 이메일 서비스 제공자
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "회원가입 이메일 인증",
      text: `회원가입을 완료하려면 다음 인증 코드를 입력하세요: ${verificationCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>회원가입 이메일 인증</h2>
          <p>회원가입을 완료하려면 다음 인증 코드를 입력하세요:</p>
          <div style="background-color: #f4f4f4; padding: 10px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px;">
            ${verificationCode}
          </div>
          <p>이 코드는 10분 후에 만료됩니다.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: "인증 코드가 이메일로 전송되었습니다.",
    });
  } catch (error) {
    console.error("이메일 인증 오류:", error);
    return NextResponse.json(
      { success: false, error: "이메일 인증 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 인증 코드 확인 API
export async function PUT(request: Request) {
  try {
    const { email, code } = await request.json();

    const verification = await prisma.emailVerification.findFirst({
      where: {
        email,
        code,
        expiresAt: {
          gt: new Date(), // 만료 시간이 현재 시간보다 이후인지 확인
        },
      },
    });

    if (!verification) {
      return NextResponse.json(
        { success: false, error: "유효하지 않거나 만료된 인증 코드입니다." },
        { status: 400 }
      );
    }

    // 인증 상태 업데이트
    await prisma.emailVerification.update({
      where: { id: verification.id },
      data: { verified: true },
    });

    return NextResponse.json({
      success: true,
      message: "이메일 인증이 완료되었습니다.",
    });
  } catch (error) {
    console.error("인증 코드 확인 오류:", error);
    return NextResponse.json(
      { success: false, error: "인증 코드 확인 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
