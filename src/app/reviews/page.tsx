"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Review } from "../explore/[id]/page";
import { Card } from "@/components/ui/card";

const ReviewsPage = () => {
  const { data: session, status } = useSession();
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      setIsLoading(true);
      fetch(`/api/reviews`)
        .then((res) => {
          if (!res.ok) {
            throw new Error("리뷰를 불러오는데 실패했습니다");
          }
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data)) {
            console.log("리뷰 데이터:", data);
            setReviews(data);
          } else {
            throw new Error("잘못된 응답 데이터");
          }
        })
        .catch((error) => {
          setError(error.message);
          console.error("리뷰 로딩 오류:", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (status !== "loading") {
      setIsLoading(false);
    }
  }, [status, session]);

  if (status === "loading")
    return <div className="p-4 text-center">로딩 중...</div>;
  if (status === "unauthenticated")
    return <div className="p-4 text-center">로그인이 필요합니다</div>;

  const handleReviewClick = (reviewId: string) => {
    router.push(`/reviews/${reviewId}`);
  };

  // 아바타 URL 생성 (이메일 기반)
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/png?seed=${
    session?.user?.email || "default"
  }`;

  return (
    <Card className="w-full box-border max-w-md mx-auto bg-gray-100 min-h-screen border-b border-gray-300">
      {/* 사용자 프로필 영역 */}
      <div className="bg-white rounded-lg shadow-md p-2">
        <div className="p-2 border-b border-gray-300 flex flex-col">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full overflow-hidden mr-3 bg-gray-200">
              {session?.user?.image ? (
                <Image
                  src={session.user.image}
                  alt="프로필"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = avatarUrl;
                  }}
                />
              ) : (
                <Image
                  src={avatarUrl}
                  alt="프로필"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {session?.user?.name || "사용자"}
              </h2>
              <p className="text-sm text-gray-500">
                작성한 리뷰 {reviews?.length || 0}개
              </p>
            </div>
          </div>
          <div className="w-full h-[1px] bg-[#666] mt-3"></div>
        </div>

        {/* 작성한 리뷰 헤더 */}
        <div className="p-2 flex items-center justify-between !border-t !border-black">
          <h2 className="font-bold">작성한 리뷰</h2>
        </div>
        {/* 리뷰 목록 */}
        {isLoading ? (
          <div className="p-4 text-center">리뷰를 불러오는 중...</div>
        ) : error ? (
          <div className=" text-center text-red-500">{error}</div>
        ) : reviews && reviews.length > 0 ? (
          <div>
            {reviews
              .sort(
                (a: any, b: any) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
              .map((review) => (
                <div
                  key={review.id}
                  className="p-2 border-b cursor-pointer"
                  onClick={() => handleReviewClick(review.id)}
                >
                  <div className="flex">
                    <div className="w-20 h-20 bg-gray-200 rounded mr-3 overflow-hidden flex-shrink-0">
                      {review.images && review.images.length > 0 ? (
                        <Image
                          src={review.images[0]}
                          alt={review.restaurant?.name || "음식점"}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src =
                              "https://via.placeholder.com/80?text=No+Image";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          이미지 없음
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">
                        {review.restaurant?.name || "장소 정보 없음"}
                      </h4>
                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                        {review.content}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(review.createdAt)
                          .toLocaleDateString("ko-KR", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          })
                          .replace(/\./g, ".")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500">
            작성한 리뷰가 없습니다
          </div>
        )}
        {/* 페이지네이션 */}
        {/* {reviews && reviews.length > 0 && (
        <div className="p-4 flex justify-center">
          <div className="flex space-x-2">
            <span className="text-blue-600">1</span>
            <span className="text-gray-400">2</span>
            <span className="text-gray-400">3</span>
            <span className="text-gray-400">...</span>
          </div>
        </div>
      )} */}
      </div>
    </Card>
  );
};

export default ReviewsPage;
