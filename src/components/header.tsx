// components/header.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MainNav } from "@/components/main-nav";

export function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 로그인 상태 확인
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include", // 쿠키를 포함해서 요청
        });
        const data = await response.json();
        console.log(data);
        setIsLoggedIn(data.isLoggedIn);
        if (data.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.error("인증 확인 오류:", error);
        setIsLoggedIn(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-primary p-4 flex items-center gap-4">
      <MainNav />
      <h1 className="text-xl font-bold text-primary-foreground">TA PASS</h1>
      <div className="ml-auto">
        {isLoggedIn ? (
          <Image
            src="/placeholder.svg"
            alt="Profile"
            width={32}
            height={32}
            className="rounded-full"
          />
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
