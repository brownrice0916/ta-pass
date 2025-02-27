// components/header.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { MainNav } from "@/components/main-nav";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export function Header() {
  const { data: session, status } = useSession();
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // 사용자의 이메일을 기반으로 일관된 랜덤 아바타 URL 생성
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/png?seed=${
    session?.user?.email || "default"
  }`;

  useEffect(() => {
    if (status === "authenticated") {
      // 세션에 이미지가 있으면 해당 이미지 사용
      if (session?.user?.image) {
        setProfileImage(session.user.image);
      }
      // 세션에 이미지가 없으면 랜덤 아바타 사용
      else {
        setProfileImage(avatarUrl);
      }
    }
  }, [session, status, avatarUrl]);

  return (
    <header className="sticky top-0 z-50 bg-primary p-4 flex items-center gap-4 w-[393px] mx-auto">
      <MainNav />
      <h1 className="text-xl font-bold text-primary-foreground">TA PASS</h1>
      <div className="ml-auto">
        {status === "authenticated" && session?.user ? (
          <Link
            href="/mypage"
            className="text-primary-foreground hover:underline"
          >
            <div className="flex items-center gap-2">
              {session.user.name && (
                <span className="text-primary-foreground">
                  {session.user.name}
                </span>
              )}
              <Image
                src={profileImage || avatarUrl}
                alt="Profile"
                width={32}
                height={32}
                className="rounded-full bg-white"
                onError={() => setProfileImage(avatarUrl)} // 이미지 로드 실패시 랜덤 아바타로 대체
              />
            </div>
          </Link>
        ) : (
          <Link
            href="/login"
            className="text-primary-foreground hover:underline"
          >
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
