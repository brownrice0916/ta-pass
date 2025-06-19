"use client";

import { useState } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import { ReviewCard, ReviewDetailDialog } from "./review-section";
import type { Restaurant } from "@prisma/client";
import { Review } from "../[id]/page";
import { useLanguage } from "@/context/LanguageContext";
import { t } from "@/lib/i18n";

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
  const { language } = useLanguage(); // 언어 가져오기

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <span className="ml-2 text-lg text-gray-600">
          {t("myPageReview.loading", language)}
        </span>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (reviews === null) {
    return null;
  }

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg">
        <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600 mb-2">
          {t("myPageReview.noReviews.title", language)}
        </p>
        <p className="text-sm text-gray-400">
          {t("myPageReview.noReviews.subtitle", language)}
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
