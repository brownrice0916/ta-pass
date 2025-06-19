"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthLayout from "@/components/layout/AuthLayout";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { t } from "@/lib/i18n";
import { useLanguage } from "@/context/LanguageContext";

export default function LoginPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false); // Remember me state 추가

  // 페이지 로드 시 저장된 이메일 로드
  useEffect(() => {
    const savedEmail = localStorage.getItem("email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true); // 저장된 이메일이 있으면 체크박스 체크
    }

    if (session) {
      router.push("/");
    }
  }, [session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        // 로그인 성공
        if (rememberMe) {
          localStorage.setItem("email", email); // "로그인 정보 기억하기"가 체크된 경우 이메일 저장
        } else {
          localStorage.removeItem("email"); // 체크되지 않은 경우 로컬스토리지에서 이메일 삭제
        }
        router.push("/"); // 메인 페이지로 리다이렉트
      } else {
        // 로그인 실패
        setError(result?.error || "로그인에 실패했습니다.");
      }
    } catch (error) {
      console.log(error);
      setError("로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const { language } = useLanguage();
  return (
    <AuthLayout activeTab="login">
      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
            {error}
          </div>
        )}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            {t("login.email", language)}
          </label>
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            {t("login.password", language)}
          </label>
          <Input
            type="password"
            placeholder={t("login.password", language)}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={() => setRememberMe(!rememberMe)} // 체크박스 토글
            disabled={isLoading}
          />
          <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700">
            {t("login.rememberMe", language)}
          </label>
        </div>
        <Button
          type="submit"
          className="w-full bg-blue-600 text-white hover:bg-blue-700"
          disabled={isLoading}
        >
          {isLoading
            ? t("login.loading", language)
            : t("login.submit", language)}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
      </div>

      {/* Additional Links */}
      <div className="flex justify-between mt-4 text-sm text-gray-500">
        <Link href="/forgot-id"> {t("login.forgotPassword", language)}</Link>
        {/* <Link href="/forgot-password"></Link> */}
      </div>
    </AuthLayout>
  );
}
