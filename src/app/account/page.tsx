"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { UserForm } from "../signup/component/user-form";
import ProfileImageUploader from "../mypage/components/profile-image-uploader";
import { useLanguage } from "@/context/LanguageContext";
import { t } from "@/lib/i18n";

export default function AccountPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { data: session, update: updateSession } = useSession();
  const { language } = useLanguage();

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
        console.error("fail load:", error);
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
      const { ...updateData } = data;
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
        throw new Error(
          responseData.error || t("accountPage.errorMessage", language)
        );
      }

      await updateSession({
        ...session,
        user: {
          ...session?.user,
          name: data.name,
        },
      });

      alert(t("accountPage.successMessage", language));
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
            ✨ {t("accountPage.editProfile", language)}
          </h1>

          <div className="flex justify-center mb-6">
            <ProfileImageUploader />
          </div>

          <div className="text-center text-sm text-gray-500">
            {t("accountPage.clickToChangeImage", language)}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-md p-4 pt-0">
        <main className="bg-white shadow-md rounded-xl p-6">
          <h1 className="text-2xl font-bold mb-6">
            {t("accountPage.accountTitle", language)}
          </h1>

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
