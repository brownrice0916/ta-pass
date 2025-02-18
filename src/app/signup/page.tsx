// app/signup/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import AuthLayout from "@/components/layout/AuthLayout";
import { UserForm } from "./component/user-form";

export default function SignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      country: "",
      gender: "",
      birthYear: "",
      birthMonth: "",
      birthDay: "",
    },
  });

  const handleEmailCheck = async () => {
    try {
      const response = await fetch(
        `/api/signup?email=${form.getValues().email}`
      );
      const data = await response.json();

      if (data.exists) {
        alert("이미 사용 중인 이메일입니다.");
        return false;
      }

      alert("사용 가능한 이메일입니다.");
      return true;
    } catch {
      alert("이메일 중복 확인 중 오류가 발생했습니다.");
      return false;
    }
  };

  interface FormData {
    email: string;
    password: string;
    confirmPassword: string;
    name: string;
    country: string;
    gender: string;
    birthYear: string;
    birthMonth: string;
    birthDay: string;
  }

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const { ...signupData } = data;

      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupData),
      });

      const responseText = await response.text();

      if (!responseText) {
        throw new Error("서버로부터 응답이 없습니다.");
      }

      const responseData = JSON.parse(responseText);

      if (!response.ok) {
        throw new Error(responseData.error || "회원가입에 실패했습니다.");
      }

      const result = await signIn("credentials", {
        email: signupData.email,
        password: signupData.password,
        redirect: false,
      });

      if (result?.ok) {
        router.push("/signup/complete");
        router.refresh();
      } else {
        router.push("/login");
      }
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout activeTab="signup">
      <main className="flex-1 p-4">
        <UserForm
          form={form}
          onSubmit={onSubmit}
          isLoading={isLoading}
          mode="signup"
          onEmailCheck={handleEmailCheck}
        />
      </main>
    </AuthLayout>
  );
}
