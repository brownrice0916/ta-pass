"use client";

import { Loader2 } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const MyPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true); // 로딩 상태 추가

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/"); // 로그아웃 후 홈 페이지로 이동
    }
  }, [status, router]);

  useEffect(() => {
    const fetchReviewCount = async () => {
      try {
        setIsLoading(true); // 데이터 가져오기 시작할 때 로딩 상태 true
        const response = await fetch("/api/reviews");
        if (!response.ok) {
          throw new Error("리뷰를 가져오는데 실패했습니다");
        }
        const reviews = await response.json();
        setReviewCount(reviews.length);
      } catch (error) {
        console.error("리뷰 로딩 에러:", error);
      } finally {
        setIsLoading(false); // 성공/실패 상관없이 로딩 상태 false
      }
    };

    if (session?.user) {
      fetchReviewCount();
    }
  }, [session]);

  const handleComingSoonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    alert("서비스 준비중입니다.");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}

      {/* Main Content */}
      <div className="flex flex-col items-center p-4">
        {/* Profile Section */}
        <div className="flex items-center w-full bg-white p-4 rounded-lg shadow-md mb-4">
          <div className="flex flex-col items-start">
            <h2 className="text-lg font-bold">안녕하세요</h2>
            <p className="text-2xl font-bold text-blue-600">
              {session?.user.name}
            </p>
            <a href="/account" className="text-sm text-gray-500 mt-2">
              계정 관리 &gt;
            </a>
          </div>
          <div className="ml-auto">
            {/* <img
                            src="/path-to-profile-image.png"
                            alt="Profile"
                            className="w-16 h-16 rounded-full"
                        /> */}
          </div>
        </div>

        {/* Stats Section */}
        <div className="flex w-full gap-4 mb-6">
          <div
            className="flex-1 bg-blue-500 text-white p-6 rounded-lg shadow-md text-center cursor-pointer"
            onClick={() => router.push("/reviews")}
          >
            <h3 className="text-lg">나의 리뷰</h3>
            {isLoading ? (
              <div className="flex justify-center items-center h-12">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <p className="text-4xl font-bold">{reviewCount}</p>
            )}
          </div>
        </div>

        {/* Shortcut Section */}
        {/* <div className="w-full grid grid-cols-3 gap-4 bg-white p-4 rounded-lg shadow-md mb-4">
                    <ShortcutItem icon="📅" label="예약정보" link="/reservations" />
                    <ShortcutItem icon="🔖" label="즐겨찾기" link="/favorites" />
                    <ShortcutItem icon="🔍" label="최근 확인" link="/recent" />
                    <ShortcutItem icon="📍" label="방문한 곳" link="/visited" />
                    <ShortcutItem icon="✍️" label="작성한 리뷰" link="/reviews" />
                </div> */}

        {/* Info Section */}
        <div className="w-full grid grid-cols-3 gap-4 bg-white p-4 rounded-lg shadow-md">
          <ShortcutItem icon="🎧" label="고객센터" link="/faq" />
          <ShortcutItem
            icon="⭐"
            label="이벤트"
            link="#"
            onClick={handleComingSoonClick}
            comingSoon
          />
          <ShortcutItem
            icon="📢"
            label="공지사항"
            link="/#"
            onClick={handleComingSoonClick}
            comingSoon
          />
        </div>

        {/* Logout Button */}
        <button
          onClick={async () => {
            await signOut();
          }}
          className="mt-6 bg-blue-600 text-white py-2 px-6 rounded-lg shadow-md"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
};
interface ShortcutItemProps {
  icon: string;
  label: string;
  link: string;
  comingSoon?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

const ShortcutItem = ({
  icon,
  label,
  link,
  comingSoon,
  onClick,
}: ShortcutItemProps) => (
  <a
    href={link}
    onClick={onClick}
    className={`relative flex flex-col items-center justify-center text-center p-4 hover:bg-gray-50 rounded-lg transition-colors ${
      comingSoon ? "cursor-default" : ""
    }`}
  >
    <div className="text-3xl mb-2">{icon}</div>
    <p className="text-sm">{label}</p>
    {comingSoon && (
      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
        <span className="text-white text-sm font-medium px-2 py-1 bg-blue-600 rounded">
          준비중
        </span>
      </div>
    )}
  </a>
);

export default MyPage;
