// app/signup/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn } from "next-auth/react";
import AuthLayout from "@/components/layout/AuthLayout";
import { UserForm } from "./component/user-form";

// Zod 스키마 정의
const signupSchema = z
  .object({
    email: z
      .string()
      .email("유효한 이메일 형식이 아닙니다.")
      .min(1, "이메일을 입력해주세요."),
    password: z
      .string()
      .min(8, "비밀번호는 최소 8자리 이상이어야 합니다.")
      .max(100, "비밀번호는 100자리 이하여야 합니다."),
    confirmPassword: z.string().min(1, "비밀번호 확인을 입력해주세요."),
    name: z
      .string()
      .min(1, "닉네임을 입력해주세요.")
      .max(50, "닉네임은 50자리 이하여야 합니다."),
    country: z.string().min(1, "국적을 선택해주세요."),
    gender: z.string().min(1, "성별을 선택해주세요."),
    birthYear: z
      .string()
      .min(1, "출생년도를 입력해주세요.")
      .regex(/^\d{4}$/, "올바른 연도 형식(YYYY)을 입력해주세요."),
    birthMonth: z
      .string()
      .min(1, "출생월을 입력해주세요.")
      .regex(/^(0?[1-9]|1[0-2])$/, "올바른 월 형식(1-12)을 입력해주세요."),
    birthDay: z
      .string()
      .min(1, "출생일을 입력해주세요.")
      .regex(
        /^(0?[1-9]|[12][0-9]|3[01])$/,
        "올바른 일 형식(1-31)을 입력해주세요."
      ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      // 날짜 유효성 검사
      const year = parseInt(data.birthYear);
      const month = parseInt(data.birthMonth) - 1; // JS에서 월은 0부터 시작
      const day = parseInt(data.birthDay);

      // 유효한 날짜인지 확인
      const date = new Date(year, month, day);

      return (
        date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === day
      );
    },
    {
      message: "유효하지 않은 날짜입니다.",
      path: ["birthDay"],
    }
  );

type FormData = z.infer<typeof signupSchema>;

export default function SignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(signupSchema),
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
    // 이메일 유효성 먼저 확인
    const email = form.getValues("email");
    if (!z.string().email().safeParse(email).success) {
      form.setError("email", { message: "유효한 이메일 형식이 아닙니다." });
      return false;
    }

    try {
      const response = await fetch(
        `/api/signup?email=${encodeURIComponent(email)}`
      );
      const data = await response.json();

      if (data.exists) {
        form.setError("email", { message: "이미 사용 중인 이메일입니다." });
        return false;
      }

      form.clearErrors("email");
      alert("사용 가능한 이메일입니다.");
      return true;
    } catch (error) {
      console.error("이메일 확인 중 오류:", error);
      form.setError("email", {
        message: "이메일 중복 확인 중 오류가 발생했습니다.",
      });
      return false;
    }
  };

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

      let responseData;
      try {
        const responseText = await response.text();
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        console.error("응답 파싱 오류:", e);
        throw new Error("서버 응답을 처리하는 중 오류가 발생했습니다.");
      }

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
      console.error("회원가입 오류:", err);
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
