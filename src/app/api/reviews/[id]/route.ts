// app/api/reviews/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

// 특정 리뷰 조회 API
export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.pathname.split("/")[3]; // Extract the `id` from the URL
  try {
    console.log(`[API] GET /api/reviews/${id} - 요청 시작`);

    // 세션 확인
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log("[API] 인증되지 않은 사용자");
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다" },
        { status: 401 }
      );
    }

    console.log(`[API] 리뷰 ID: ${id}, 사용자 ID: ${session.user.id}`);

    // 리뷰 정보 조회
    const review = await prisma.review.findUnique({
      where: {
        id: id,
      },
      include: {
        restaurant: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // 리뷰가 존재하지 않는 경우
    if (!review) {
      console.log(`[API] 리뷰를 찾을 수 없음: ${id}`);
      return NextResponse.json(
        { error: "리뷰를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 리뷰 작성자와 현재 사용자가 일치하는지 확인
    const userId = Number(session.user.id);
    if (review.userId !== userId) {
      console.log(
        `[API] 권한 없음: 리뷰 작성자(${review.userId})와 현재 사용자(${userId})가 다름`
      );
      return NextResponse.json(
        { error: "이 리뷰를 볼 수 있는 권한이 없습니다" },
        { status: 403 }
      );
    }

    console.log(`[API] 리뷰 조회 성공: ${id}`);
    return NextResponse.json(review);
  } catch (error) {
    console.error(`[API] 리뷰 조회 오류:`, error);
    return NextResponse.json(
      { error: "리뷰 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// 리뷰 수정 API
export async function PUT(request: Request) {
  const url = new URL(request.url);
  const id = url.pathname.split("/")[3]; // Extract the `id` from the URL

  try {
    console.log(`[API] PUT /api/reviews/${id} - 요청 시작`);

    // 세션 확인
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다" },
        { status: 401 }
      );
    }

    const reviewId = id;
    const body = await request.json();
    const { rating, content } = body;

    // 필수 입력값 확인
    if (!rating || !content) {
      return NextResponse.json(
        { error: "평점과 내용은 필수입니다" },
        { status: 400 }
      );
    }

    // 리뷰 존재 여부 및 권한 확인
    const existingReview = await prisma.review.findUnique({
      where: {
        id: reviewId,
      },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: "리뷰를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 리뷰 작성자와 현재 사용자가 일치하는지 확인
    const userId = Number(session.user.id);
    if (existingReview.userId !== userId) {
      return NextResponse.json(
        { error: "이 리뷰를 수정할 권한이the  없습니다" },
        { status: 403 }
      );
    }

    // 리뷰 업데이트
    const updatedReview = await prisma.review.update({
      where: {
        id: reviewId,
      },
      data: {
        rating,
        content,
        updatedAt: new Date(),
      },
      include: {
        restaurant: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    console.log(`[API] 리뷰 업데이트 성공: ${reviewId}`);
    return NextResponse.json(updatedReview);
  } catch (error) {
    console.error(`[API] 리뷰 업데이트 오류:`, error);
    return NextResponse.json(
      { error: "리뷰 업데이트 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// 리뷰 삭제 API
export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.pathname.split("/")[3];
  try {
    console.log(`[API] DELETE /api/reviews/${id} - 요청 시작`);

    // 세션 확인
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다" },
        { status: 401 }
      );
    }

    const reviewId = id;

    // 리뷰 존재 여부 및 권한 확인
    const existingReview = await prisma.review.findUnique({
      where: {
        id: reviewId,
      },
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: "리뷰를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 리뷰 작성자와 현재 사용자가 일치하는지 확인
    const userId = Number(session.user.id);
    if (existingReview.userId !== userId) {
      return NextResponse.json(
        { error: "이 리뷰를 삭제할 권한이 없습니다" },
        { status: 403 }
      );
    }

    // 리뷰 삭제
    await prisma.review.delete({
      where: {
        id: reviewId,
      },
    });

    console.log(`[API] 리뷰 삭제 성공: ${reviewId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`[API] 리뷰 삭제 오류:`, error);
    return NextResponse.json(
      { error: "리뷰 삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
