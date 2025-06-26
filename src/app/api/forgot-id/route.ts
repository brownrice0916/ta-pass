// /app/api/forgot-id/route.ts
export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Resend } from "resend";

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

    // Resend로 이메일 전송
    const resend = new Resend(process.env.RESEND_API_KEY!);
    const resetLink = `https://ta-pass.vercel.app/reset-password?token=${user.id}`;

    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev", // 기본 도메인 사용
      to: [email],
      subject: "비밀번호 재설정 요청",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2>비밀번호 재설정 요청</h2>
          <p>비밀번호를 재설정하려면 아래 버튼을 클릭하세요:</p>
          <div style="text-align:center;margin:20px 0">
            <a href="${resetLink}" 
               style="background:#007bff;color:white;padding:12px 24px;text-decoration:none;border-radius:5px;display:inline-block">
              비밀번호 재설정
            </a>
          </div>
          <p style="color:#666;font-size:14px">
            링크가 작동하지 않으면 다음 주소를 복사해서 브라우저에 붙여넣으세요:<br>
            <code>${resetLink}</code>
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend 에러:", error);
      return NextResponse.json(
        { success: false, error: `메일 발송 실패: ${error.message}` },
        { status: 500 }
      );
    }

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
