"use client";

import { useState } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import { ReviewCard, ReviewDetailDialog } from "./review-section";
import type { Restaurant } from "@prisma/client";
import { Review } from "../[id]/page";

interface MyPageReviewSectionProps {
  reviews: Review[] | null;
  error: string | null;
  isLoading: boolean;
}

export default function MyPageReviewSection({
  reviews,
  error,
  isLoading,
}: MyPageReviewSectionProps) {
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <span className="ml-2 text-lg text-gray-600">
          리뷰를 불러오는 중...
        </span>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (reviews === null) {
    return null; // 데이터가 아직 로드되지 않았으면 아무것도 렌더링하지 않음
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg">
        <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600 mb-2">아직 작성한 리뷰가 없습니다.</p>
        <p className="text-sm text-gray-400">
          방문한 식당에 대한 리뷰를 작성해보세요!
        </p>
      </div>
    );
  }

  return (
    <div className="p-1">
      <div className="grid grid-cols-1 gap-4">
        {reviews.map((review: Review) => (
          <ReviewCard
            key={review.id}
            restaurant={review.restaurant as Restaurant}
            review={review as Review}
            onOpenDetail={setSelectedReview}
          />
        ))}
      </div>

      <ReviewDetailDialog
        reviews={reviews}
        restaurant={selectedReview?.restaurant as Restaurant}
        review={selectedReview}
        open={!!selectedReview}
        onClose={() => setSelectedReview(null)}
      />
    </div>
  );
}
