"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AuthLayout from "@/components/layout/AuthLayout";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form"; // useForm 추가
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export default function SignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // useForm 훅을 사용하여 폼 데이터 관리
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

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = form;

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

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      // confirmPassword를 제외한 필요한 데이터만 추출
      const { confirmPassword, ...signupData } = data;
      console.log("전송하는 데이터:", signupData);

      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupData), // confirmPassword가 제외된 데이터
      });

      const responseText = await response.text();
      console.log("응답 텍스트:", responseText);

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
        router.refresh(); // 세션 상태를 새로고침
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
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 이메일 */}
            <FormField
              control={control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    이메일 <span className="text-red-500">*</span>
                  </FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="이메일을 입력하세요"
                        className="placeholder:text-gray-400 text-black"
                      />
                    </FormControl>
                    <Button
                      type="button"
                      className="shrink-0"
                      disabled={!field.value || isLoading}
                      onClick={handleEmailCheck}
                    >
                      중복확인
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 비밀번호 */}
            <FormField
              control={control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    비밀번호 <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="비밀번호(최소 8자리 이상)"
                      className="placeholder:text-gray-400 text-black"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 비밀번호 확인 */}
            <FormField
              control={control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    비밀번호 확인 <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="비밀번호(최소 8자리 이상)"
                      className="placeholder:text-gray-400 text-black"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 닉네임 */}
            <FormField
              control={control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    닉네임 <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="닉네임"
                      className="placeholder:text-gray-400 text-black"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 국적 */}
            <FormField
              control={control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    국적 <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="placeholder:text-gray-400 text-black">
                      <SelectValue
                        placeholder="국적 선택"
                        className="placeholder:text-gray-400 text-black" // 플레이스홀더 색상 변경
                      />
                    </SelectTrigger>
                    <SelectContent className="cursor-pointer">
                      <SelectItem className="cursor-pointer" value="kr">
                        대한민국
                      </SelectItem>
                      <SelectItem className="cursor-pointer" value="jp">
                        일본
                      </SelectItem>
                      <SelectItem className="cursor-pointer" value="cn">
                        중국
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 성별 */}
            <FormField
              control={control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    성별 <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="placeholder:text-gray-400 text-black">
                      <SelectValue
                        placeholder="성별 선택"
                        className="placeholder:text-gray-400 text-black" // 플레이스홀더 색상 변경
                      />
                    </SelectTrigger>
                    <SelectContent className="cursor-pointer">
                      <SelectItem className="cursor-pointer" value="male">
                        남성
                      </SelectItem>
                      <SelectItem className="cursor-pointer" value="female">
                        여성
                      </SelectItem>
                      <SelectItem className="cursor-pointer" value="other">
                        기타
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 생년월일 */}
            <FormItem>
              <FormLabel>
                생년월일 <span className="text-red-500">*</span>
              </FormLabel>
              <div className="grid grid-cols-3 gap-2">
                <FormField
                  control={control}
                  name="birthYear"
                  render={({ field }) => (
                    <FormControl>
                      <Input
                        {...field}
                        className="placeholder:text-gray-400 text-black"
                        placeholder="YYYY"
                      />
                    </FormControl>
                  )}
                />
                <FormField
                  control={control}
                  name="birthMonth"
                  render={({ field }) => (
                    <FormControl>
                      <Input
                        {...field}
                        className="placeholder:text-gray-400 text-black"
                        placeholder="MM"
                      />
                    </FormControl>
                  )}
                />
                <FormField
                  control={control}
                  name="birthDay"
                  render={({ field }) => (
                    <FormControl>
                      <Input
                        {...field}
                        className="placeholder:text-gray-400 text-black"
                        placeholder="DD"
                      />
                    </FormControl>
                  )}
                />
              </div>
              <FormMessage />
            </FormItem>

            <Button type="submit" className="w-full">
              가입하기
            </Button>
          </form>
        </Form>
      </main>
    </AuthLayout>
  );
}
