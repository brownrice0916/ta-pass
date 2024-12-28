// components/header.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { MainNav } from "@/components/main-nav";
import { useSession } from "next-auth/react";

export function Header() {
  const { data: session, status } = useSession();

  // 랜덤 아바타 URL 생성 (PNG 형식으로 변경)
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/png?seed=${session?.user?.email || 'default'}`;

  return (
    <header className="sticky top-0 z-50 bg-primary p-4 flex items-center gap-4">
      <MainNav />
      <h1 className="text-xl font-bold text-primary-foreground">TA PASS</h1>
      <div className="ml-auto">
        {status === "authenticated" && session?.user ? (
          <Link href="/mypage" className="text-primary-foreground hover:underline">
            <div className="flex items-center gap-2">
              {session.user.name && (
                <span className="text-primary-foreground">
                  {session.user.name}
                </span>
              )}
              <Image
                src={avatarUrl}
                alt="Profile"
                width={32}
                height={32}
                className="rounded-full bg-white"
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