"use client";

import { Suspense } from "react";
import ResetPasswordForm from "./component/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">비밀번호 재설정</h2>
      <Suspense
        fallback={
          <div className="flex justify-center items-center min-h-[200px]">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
