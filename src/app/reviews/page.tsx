"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import type { Review } from "../restaurants/[id]/page";
import MyPageReviewSection from "../restaurants/components/mypage-review-section";

const ReviewsPage = () => {
  const { data: session, status } = useSession();
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setIsLoading(true);
      fetch(`/api/reviews?userId=${session.user.id}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to fetch reviews");
          }
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data)) {
            console.log("data", data);
            setReviews(data);
          } else {
            throw new Error("Invalid response data");
          }
        })
        .catch((error) => {
          setError(error.message);
          console.error("Error fetching reviews:", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (status !== "loading") {
      setIsLoading(false);
    }
  }, [status, session]);

  if (status === "loading") return <p>로딩 중...</p>;
  if (status === "unauthenticated") return <p>로그인이 필요합니다.</p>;

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">내가 작성한 리뷰</h1>
      <MyPageReviewSection
        isLoading={isLoading}
        reviews={reviews}
        error={error}
      />
    </div>
  );
};

export default ReviewsPage;
