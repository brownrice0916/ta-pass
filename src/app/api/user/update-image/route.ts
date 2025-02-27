// app/api/user/update-image/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { put } from "@vercel/blob";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    // 세션 확인
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    // 폼 데이터 파싱
    const formData = await request.formData();
    const imageFile = formData.get("image") as File;

    // 이미지 파일 검증
    if (!imageFile) {
      return NextResponse.json(
        { error: "이미지 파일이 필요합니다." },
        { status: 400 }
      );
    }

    if (!imageFile.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "이미지 파일만 업로드 가능합니다." },
        { status: 400 }
      );
    }

    // 파일 크기 제한 (5MB)
    if (imageFile.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "이미지 크기는 5MB 이하여야 합니다." },
        { status: 400 }
      );
    }

    // Vercel Blob에 이미지 업로드
    const userId = session.user.id;
    const filename = `user-${userId}-${Date.now()}-${imageFile.name.replace(
      /[^a-zA-Z0-9.]/g,
      ""
    )}`;

    const blob = await put(`users/${filename}`, imageFile, {
      access: "public",
    });

    // 사용자 정보 업데이트
    const userIdNumber = Number(userId);
    await prisma.user.update({
      where: { id: userIdNumber },
      data: { image: blob.url },
    });

    return NextResponse.json({ imageUrl: blob.url }, { status: 200 });
  } catch (error) {
    console.error("프로필 이미지 업데이트 오류:", error);
    return NextResponse.json(
      { error: "이미지 업로드 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
