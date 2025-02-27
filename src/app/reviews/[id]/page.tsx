"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface ReviewData {
  id: string;
  content: string;
  rating: number;
  images: string[];
  restaurantId: string;
  restaurant: {
    id: string;
    name: string;
    address: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function ReviewDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const reviewId = params.id;

  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated" && session?.user && reviewId) {
      setIsLoading(true);
      console.log(`리뷰 상세 정보 요청: ${reviewId}`);

      fetch(`/api/reviews/${reviewId}`)
        .then((res) => {
          if (!res.ok) {
            console.error("리뷰 상세 요청 실패:", res.status, res.statusText);
            throw new Error(`리뷰를 불러오는데 실패했습니다 (${res.status})`);
          }
          return res.json();
        })
        .then((data) => {
          console.log("리뷰 상세 데이터:", data);
          setReviewData(data);
          setContent(data.content);
          setRating(data.rating);
          setIsLoading(false);
        })
        .catch((error) => {
          setError("리뷰를 불러오는 중 오류가 발생했습니다");
          console.error("리뷰 상세 로딩 오류:", error);
          setIsLoading(false);
        });
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [reviewId, status, session, router]);

  const handleUpdateReview = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          rating,
        }),
      });

      if (!response.ok) {
        throw new Error("리뷰 업데이트에 실패했습니다");
      }

      const updatedReview = await response.json();
      setReviewData(updatedReview);
      setIsEditing(false);
    } catch (error) {
      console.error("리뷰 업데이트 오류:", error);
      setError("리뷰 수정 중 오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (window.confirm("정말로 이 리뷰를 삭제하시겠습니까?")) {
      try {
        const response = await fetch(`/api/reviews/${reviewId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("리뷰 삭제에 실패했습니다");
        }

        router.push("/reviews");
      } catch (error) {
        console.error("리뷰 삭제 오류:", error);
        setError("리뷰 삭제 중 오류가 발생했습니다");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto bg-white min-h-screen p-4 flex items-center justify-center">
        <p>리뷰를 불러오는 중...</p>
      </div>
    );
  }

  if (error && !reviewData) {
    return (
      <div className="w-full max-w-md mx-auto bg-white min-h-screen p-4 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white min-h-screen pb-16">
      {/* 리뷰 내용 */}
      <div className="p-4">
        {/* 음식점 정보 */}
        <div className="mb-4">
          <h2 className="text-xl font-bold">
            {reviewData?.restaurant?.name || "음식점"}
          </h2>
          <p className="text-sm text-gray-500">
            {reviewData?.restaurant?.address || ""}
          </p>
          <p className="text-sm text-gray-500">
            작성일:{" "}
            {new Date(reviewData?.createdAt || "").toLocaleDateString("ko-KR")}
          </p>
        </div>

        {/* 이미지 영역 */}
        {reviewData?.images && reviewData.images.length > 0 && (
          <div className="mb-4">
            <div className="h-64 bg-gray-200 relative rounded overflow-hidden">
              <Image
                src={reviewData.images[0]}
                alt="리뷰 이미지"
                fill
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src =
                    "https://via.placeholder.com/400x300?text=이미지+로드+실패";
                }}
              />
            </div>
            {reviewData.images.length > 1 && (
              <div className="flex mt-2 space-x-2 overflow-x-auto">
                {reviewData.images.slice(1).map((image, index) => (
                  <div
                    key={index}
                    className="w-16 h-16 bg-gray-200 relative flex-shrink-0 rounded overflow-hidden"
                  >
                    <Image
                      src={image}
                      alt={`리뷰 이미지 ${index + 2}`}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://via.placeholder.com/64?text=오류";
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 별점 표시 */}
        <div className="mb-4">
          <div className="flex">
            {isEditing ? (
              // 수정 모드일 때 별점 선택
              <div>
                <p className="text-sm font-medium mb-1">평점</p>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="text-2xl focus:outline-none"
                    >
                      {star <= rating ? "★" : "☆"}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              // 읽기 모드일 때 별점 표시
              <div>
                <p className="text-sm font-medium mb-1">평점</p>
                {reviewData && (
                  <div className="flex text-2xl text-yellow-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star}>
                        {star <= reviewData.rating ? "★" : "☆"}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 리뷰 내용 */}
        {isEditing ? (
          // 수정 모드
          <div className="mb-4">
            <label htmlFor="content" className="block text-sm font-medium mb-1">
              리뷰 내용
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border rounded p-2 min-h-[100px]"
              placeholder="리뷰 내용을 입력하세요"
            />
          </div>
        ) : (
          // 읽기 모드
          <div className="mb-4">
            <p className="text-sm font-medium mb-1">리뷰 내용</p>
            <p className="p-2 bg-gray-50 rounded min-h-[100px]">
              {reviewData?.content}
            </p>
          </div>
        )}

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* 수정/삭제 버튼 */}
        <div className="mt-6 flex space-x-2">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="w-1/2 py-2 bg-gray-200 rounded"
              >
                취소
              </button>
              <button
                onClick={handleUpdateReview}
                disabled={isSubmitting}
                className="w-1/2 py-2 bg-blue-600 text-white rounded"
              >
                {isSubmitting ? "저장 중..." : "저장하기"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleDeleteReview}
                className="w-1/2 py-2 bg-red-50 text-red-500 rounded"
              >
                삭제하기
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="w-1/2 py-2 bg-blue-600 text-white rounded"
              >
                수정하기
              </button>
            </>
          )}
        </div>
      </div>

      {/* 하단 네비게이션 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-between p-4">
        <Link href="#" className="flex flex-col items-center text-gray-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </Link>
        <Link href="#" className="flex flex-col items-center text-gray-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </Link>
        <Link href="/" className="flex flex-col items-center text-gray-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        </Link>
        <Link href="#" className="flex flex-col items-center text-gray-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        </Link>
        <Link
          href="/mypage"
          className="flex flex-col items-center text-gray-500"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}
