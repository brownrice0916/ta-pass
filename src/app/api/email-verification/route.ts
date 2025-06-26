// Edge 런타임에서 Prisma가 안 돌아가므로 Node.js 런타임을 명시
export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Resend } from "resend";

// 인증 코드 생성
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6자리
}

// ─────────────────────────────────────────
// POST /api/email-verification  (코드 발송)
// ─────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // 이메일 중복 여부
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "이미 사용 중인 이메일입니다." },
        { status: 400 }
      );
    }

    // 인증 코드 저장(10분 유효)
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1_000);

    await prisma.emailVerification.deleteMany({ where: { email } });
    await prisma.emailVerification.create({
      data: { email, code, expiresAt },
    });

    // ── Resend로 메일 발송
    const resend = new Resend(process.env.RESEND_API_KEY!);

    console.log("메일 발송 시도:", {
      from: process.env.RESEND_FROM,
      to: email,
      apiKey: process.env.RESEND_API_KEY ? "존재함" : "없음",
    });

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM || "onboarding@resend.dev",
      to: [email],
      subject: "회원가입 이메일 인증",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2>회원가입 이메일 인증</h2>
          <p>다음 인증 코드를 입력하세요.</p>
          <div style="background:#f4f4f4;padding:10px;font-size:24px;font-weight:bold;text-align:center;letter-spacing:5px">
            ${code}
          </div>
          <p>코드는 10분 후 만료됩니다.</p>
        </div>
      `,
    });

    // 🔥 중요: Resend 에러 확인
    if (error) {
      console.error("Resend 에러:", error);
      return NextResponse.json(
        { success: false, error: `메일 발송 실패: ${error.message}` },
        { status: 500 }
      );
    }

    console.log("메일 발송 성공:", data);

    return NextResponse.json({
      success: true,
      message: "인증 코드가 이메일로 전송되었습니다.",
    });
  } catch (err) {
    console.error("이메일 인증 오류:", err);
    return NextResponse.json(
      { success: false, error: "이메일 전송 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────
// PUT /api/email-verification  (코드 검증)
// ─────────────────────────────────────────
export async function PUT(request: Request) {
  try {
    const { email, code } = await request.json();

    const verification = await prisma.emailVerification.findFirst({
      where: { email, code, expiresAt: { gt: new Date() } },
    });

    if (!verification) {
      return NextResponse.json(
        { success: false, error: "유효하지 않거나 만료된 인증 코드입니다." },
        { status: 400 }
      );
    }

    await prisma.emailVerification.update({
      where: { id: verification.id },
      data: { verified: true },
    });

    return NextResponse.json({
      success: true,
      message: "이메일 인증이 완료되었습니다.",
    });
  } catch (err) {
    console.error("인증 코드 확인 오류:", err);
    return NextResponse.json(
      { success: false, error: "인증 코드 확인 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
