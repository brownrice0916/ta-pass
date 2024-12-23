import { getSession } from "next-auth/react";
import { NextResponse } from "next/server";
import { NextApiRequest } from "next"; // NextApiRequest를 임포트

export async function GET(req: Request) {
  try {
    // `req`를 NextApiRequest로 변환
    const apiReq = req as unknown as NextApiRequest;
    const session = await getSession({ req: apiReq });

    console.log(session);

    if (!session?.user) {
      return NextResponse.json({
        isLoggedIn: false,
      });
    }

    return NextResponse.json({
      isLoggedIn: true,
      user: {
        email: session.user.email,
        name: session.user.name,
      },
    });
  } catch (error) {
    return NextResponse.json({
      isLoggedIn: false,
      error: "인증 확인 중 오류가 발생했습니다.",
    });
  }
}
