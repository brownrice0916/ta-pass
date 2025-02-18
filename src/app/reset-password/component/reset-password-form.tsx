// reset-password-form.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (newPassword !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage("비밀번호가 성공적으로 재설정되었습니다.");
        router.push("/login");
      } else {
        setError(result.error || "비밀번호 재설정 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error(error);
      setError("서버와의 연결에 문제가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
          {error}
        </div>
      )}
      {message && (
        <div className="p-3 text-sm text-green-500 bg-green-50 rounded-md">
          {message}
        </div>
      )}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">
          새 비밀번호
        </label>
        <Input
          type="password"
          placeholder="새 비밀번호"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">
          비밀번호 확인
        </label>
        <Input
          type="password"
          placeholder="비밀번호 확인"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <Button
        type="submit"
        className="w-full bg-blue-600 text-white hover:bg-blue-700"
        disabled={isLoading}
      >
        {isLoading ? "처리 중..." : "비밀번호 재설정"}
      </Button>
    </form>
  );
}
