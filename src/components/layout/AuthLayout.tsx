"use client";

import { useLanguage } from "@/context/LanguageContext";
import { t } from "@/lib/i18n";
import Link from "next/link";
import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  activeTab: "login" | "signup";
}

export default function AuthLayout({ children, activeTab }: AuthLayoutProps) {
  const { language } = useLanguage();
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-md p-4">
        <div className="bg-white shadow-md rounded-lg p-6">
          {/* Tabs */}
          <div className="flex mb-6 border-b">
            <Link
              href="/login"
              className={`flex-1 text-center py-2 font-semibold border-b-2 ${
                activeTab === "login" ? "border-blue-600" : "text-gray-500"
              }`}
            >
              {t("login.submit", language)}
            </Link>
            <Link
              href="/signup"
              className={`flex-1 text-center py-2 font-semibold border-b-2 ${
                activeTab === "signup" ? "border-blue-600" : "text-gray-500"
              }`}
            >
              {t("signup.title", language)}
            </Link>
          </div>
          {/* Content */}
          {children}
        </div>
      </div>
    </div>
  );
}
