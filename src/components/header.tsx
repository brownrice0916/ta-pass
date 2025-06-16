"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Language, useLanguage } from "@/context/LanguageContext";

export function Header() {
  const { data: session, status } = useSession();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const { language, setLanguage } = useLanguage();

  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/png?seed=${
    session?.user?.email || "default"
  }`;

  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user?.image) {
        setProfileImage(session.user.image);
      } else {
        setProfileImage(avatarUrl);
      }
    }
  }, [session, status, avatarUrl]);

  console.log("language:", language);

  return (
    <header className="sticky top-0 z-50 bg-[#1977F3] p-3 w-[393px] mx-auto">
      <div className="flex items-center justify-between">
        {/* Language Dropdown */}
        <div className="relative">
          <select
            value={language}
            onChange={(e) => {
              console.log("Language changing to:", e.target.value);
              setLanguage(e.target.value as Language);
            }}
            className="bg-white text-black px-2 py-1 rounded text-sm"
          >
            <option value="ko">한국어</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
            <option value="zh">中文</option>
          </select>
        </div>

        {/* Centered Logo */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <Image
            width={100}
            height={30}
            src={"/logos/logo_white.png"}
            alt="ta:pass logo"
            className="object-contain"
          />
        </div>

        {/* Profile Image only (no name) */}
        <div>
          {status === "authenticated" && session?.user ? (
            <Link href="/mypage">
              <Image
                src={profileImage || avatarUrl}
                alt="Profile"
                width={36}
                height={36}
                className="rounded-full object-cover border border-white"
                style={{ aspectRatio: "1 / 1" }}
                onError={() => setProfileImage(avatarUrl)}
              />
            </Link>
          ) : (
            <Link href="/login" className="text-white text-sm hover:underline">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
