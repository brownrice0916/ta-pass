"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const MyPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/"); // 로그아웃 후 홈 페이지로 이동
    }
  }, [status, router]);

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
            <p className="text-4xl font-bold">{}</p>
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
          <ShortcutItem icon="⭐" label="이벤트" link="/events" />
          <ShortcutItem icon="📢" label="공지사항" link="/notices" />
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

const ShortcutItem = ({
  icon,
  label,
  link,
}: {
  icon: string;
  label: string;
  link: string;
}) => (
  <a
    href={link}
    className="flex flex-col items-center justify-center text-center p-4"
  >
    <div className="text-3xl mb-2">{icon}</div>
    <p className="text-sm">{label}</p>
  </a>
);

export default MyPage;
