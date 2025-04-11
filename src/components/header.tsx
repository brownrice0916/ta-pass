"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export function Header() {
  const { data: session, status } = useSession();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>("");

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

  return (
    <header className="sticky top-0 z-50 bg-[#1977F3] p-3 w-[393px] mx-auto">
      <div className="flex items-center justify-between">
        {/* Language Dropdown */}
        <div className="relative">
          <select
            className="bg-transparent text-white text-sm py-0.5 px-2 rounded border border-white cursor-pointer"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="" disabled hidden>
              Language
            </option>
            <option value="한국어">Korean</option>
            <option value="English">English</option>
            <option value="日本語">Japanese</option>
            <option value="中文">Chinese</option>
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
