// app/account/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { UserForm } from "../signup/component/user-form";
import ProfileImageUploader from "../mypage/components/profile-image-uploader";

export default function AccountPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { data: session, update: updateSession } = useSession();

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

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/account");
        const data = await response.json();

        if (data.success) {
          form.reset({
            email: data.user.email,
            name: data.user.name,
            country: data.user.country,
            gender: data.user.gender,
            birthYear: data.user.birthYear,
            birthMonth: data.user.birthMonth,
            birthDay: data.user.birthDay,
          });
        }
      } catch (error) {
        console.error("사용자 정보 로딩 실패:", error);
      }
    };

    if (session?.user) {
      fetchUserData();
    }
  }, [session, form]);

  interface FormData {
    email: string;
    password: string;
    confirmPassword?: string;
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
      const { ...updateData } = data as FormData;

      delete updateData.confirmPassword;

      const response = await fetch("/api/account", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "정보 수정에 실패했습니다.");
      }

      // 세션 업데이트
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          name: data.name,
        },
      });

      alert("정보가 성공적으로 수정되었습니다.");
      router.push("/");
      router.refresh();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 mb-20">
      <div className="mx-auto max-w-lg p-4">
        <div className="bg-gradient-to-br from-white to-gray-50 shadow-lg rounded-xl p-6 border border-gray-100">
          <h1 className="text-xl font-semibold text-gray-800 mb-4 text-center">
            ✨ 프로필 수정
          </h1>

          <div className="flex justify-center mb-6">
            <ProfileImageUploader />
          </div>

          {/* 추가 콘텐츠가 있다면 여기에 삽입 */}
          <div className="text-center text-sm text-gray-500">
            이미지를 클릭해서 프로필 사진을 변경하세요
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-md p-4 pt-0">
        <main className="bg-white shadow-md rounded-xl p-6">
          <h1 className="text-2xl font-bold mb-6">계정 관리</h1>

          <UserForm
            form={form}
            onSubmit={onSubmit}
            isLoading={isLoading}
            mode="edit"
          />
        </main>
      </div>
    </div>
  );
}
