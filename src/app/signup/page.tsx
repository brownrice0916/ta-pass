"use client";

import { useState } from "react";
import Link from "next/link";
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
import { TabsList, TabsTrigger, Tabs } from "@radix-ui/react-tabs";
import AuthLayout from "@/components/layout/AuthLayout";

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    country: "",
    gender: "",
    birthYear: "",
    birthMonth: "",
    birthDay: "",
  });

  // app/signup/page.tsx의 handleSubmit 함수를 수정
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailCheck = async () => {
    try {
      const response = await fetch(`/api/signup?email=${formData.email}`);
      const data = await response.json();

      if (data.exists) {
        alert("이미 사용 중인 이메일입니다.");
        return false;
      }

      alert("사용 가능한 이메일입니다.");
      return true;
    } catch (error) {
      alert("이메일 중복 확인 중 오류가 발생했습니다.");
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // confirmPassword를 제외한 필요한 데이터만 추출
      const { confirmPassword, ...signupData } = formData;
      console.log("전송하는 데이터:", signupData);

      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupData), // confirmPassword가 제외된 데이터
      });

      console.log("응답 상태:", response.status);

      const responseText = await response.text();
      console.log("응답 텍스트:", responseText);

      if (!responseText) {
        throw new Error("서버로부터 응답이 없습니다.");
      }

      const data = JSON.parse(responseText);

      if (!response.ok) {
        throw new Error(data.error || "회원가입에 실패했습니다.");
      }

      router.push("/signup/complete");
    } catch (err: any) {
      setError(err.message);
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout activeTab="signup">
      <main className="flex-1 p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                required
                type="email"
                placeholder="이메일"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
              />
              <Button
                type="button"
                className="shrink-0"
                onClick={handleEmailCheck}
                disabled={!formData.email || isLoading}
              >
                중복확인
              </Button>
            </div>

            <Input
              required
              type="password"
              placeholder="비밀번호(최소 8자리 이상)"
              value={formData.password}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  password: e.target.value,
                }))
              }
            />

            <Input
              required
              type="password"
              placeholder="비밀번호 확인"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  confirmPassword: e.target.value,
                }))
              }
            />

            <Input
              required
              placeholder="내용"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
            />

            <Select
              value={formData.country}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, country: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="국적" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kr">대한민국</SelectItem>
                <SelectItem value="jp">일본</SelectItem>
                <SelectItem value="cn">중국</SelectItem>
                {/* Add more countries as needed */}
              </SelectContent>
            </Select>

            <Select
              value={formData.gender}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, gender: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="성별" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">남성</SelectItem>
                <SelectItem value="female">여성</SelectItem>
                <SelectItem value="other">기타</SelectItem>
              </SelectContent>
            </Select>

            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="YYYY"
                value={formData.birthYear}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    birthYear: e.target.value,
                  }))
                }
              />
              <Input
                placeholder="MM"
                value={formData.birthMonth}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    birthMonth: e.target.value,
                  }))
                }
              />
              <Input
                placeholder="DD"
                value={formData.birthDay}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    birthDay: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <Button type="submit" className="w-full">
            가입하기
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                OR SIGN UP WITH
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Button variant="outline" className="w-full">
              Google
            </Button>
            <Button variant="outline" className="w-full">
              Facebook
            </Button>
            <Button variant="outline" className="w-full">
              Apple
            </Button>
          </div>
        </form>
      </main>
    </AuthLayout>
  );
}
