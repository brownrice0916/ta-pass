"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { SubmitHandler } from "react-hook-form";
import { countries } from "countries-list";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserFormProps {
  form: UseFormReturn<FormValues>;
  onSubmit: SubmitHandler<FormValues>;
  isLoading: boolean;
  mode: "signup" | "edit";
  onEmailCheck?: () => Promise<boolean>;
}

interface FormValues {
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

export function UserForm({ form, onSubmit, isLoading, mode }: UserFormProps) {
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isCodeInputEnabled, setIsCodeInputEnabled] = useState(false);
  const [open, setOpen] = useState(false);

  const countryOptions = Object.entries(countries).map(([code, country]) => ({
    value: code.toLowerCase(),
    label: country.name,
  }));
  countryOptions.sort((a, b) => a.label.localeCompare(b.label));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* 1줄: 이메일 + 인증번호 전송 */}
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="이메일 입력"
            {...form.register("email")}
            disabled={isEmailVerified}
            className="text-black"
          />
          <Button
            type="button"
            onClick={async () => {
              const email = form.getValues("email");
              if (!email || !email.includes("@")) {
                alert("유효한 이메일을 입력해주세요.");
                return;
              }

              setIsVerifying(true);
              try {
                const res = await fetch(
                  `/api/signup?email=${encodeURIComponent(email)}`
                );
                const check = await res.json();
                if (check.exists) {
                  alert("이미 사용 중인 이메일입니다.");
                  return;
                }

                const response = await fetch("/api/email-verification", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email }),
                });
                const data = await response.json();
                if (data.success) {
                  setIsCodeInputEnabled(true);
                  alert("인증 코드가 전송되었습니다.");
                } else {
                  alert(data.error || "인증 코드 전송 실패");
                }
              } catch (error) {
                console.error(error);
                alert("요청 중 오류가 발생했습니다.");
              } finally {
                setIsVerifying(false);
              }
            }}
            disabled={isEmailVerified || isVerifying}
          >
            인증번호 전송
          </Button>
        </div>
        {/* 2줄: 인증번호 입력 + 확인 */}
        <div className="flex gap-2 items-center mt-2">
          <Input
            type="text"
            placeholder="인증 코드 입력"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            className="text-black flex-1"
            disabled={!isCodeInputEnabled || isEmailVerified}
          />
          <div className="shrink-0">
            {isEmailVerified ? (
              <Button
                type="button"
                disabled
                className="bg-green-600 cursor-default"
              >
                인증완료
              </Button>
            ) : (
              <Button
                type="button"
                onClick={async () => {
                  setIsVerifying(true);
                  try {
                    const response = await fetch("/api/email-verification", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        email: form.getValues("email"),
                        code: verificationCode,
                      }),
                    });
                    const data = await response.json();
                    if (data.success) {
                      setIsEmailVerified(true);
                      alert("이메일 인증이 완료되었습니다.");
                    } else {
                      alert(data.error || "인증 코드가 유효하지 않습니다.");
                    }
                  } catch (error) {
                    console.error(error);
                    alert("인증 확인 중 오류가 발생했습니다.");
                  } finally {
                    setIsVerifying(false);
                  }
                }}
                disabled={
                  verificationCode.length !== 6 ||
                  isVerifying ||
                  !isCodeInputEnabled
                }
              >
                인증확인
              </Button>
            )}
          </div>
        </div>

        {/* 비밀번호 */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                비밀번호<span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  placeholder="비밀번호 입력"
                  className="text-black"
                  required
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 비밀번호 확인 */}
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                비밀번호 확인<span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  placeholder="비밀번호 재입력"
                  className="text-black"
                  required
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 닉네임 */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                닉네임<span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="닉네임 입력"
                  className="text-black"
                  required
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 국적 */}
        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>
                국적<span className="text-red-500">*</span>
              </FormLabel>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between bg-white text-black",
                        !field.value && "text-gray-500"
                      )}
                      disabled={isLoading}
                    >
                      {field.value
                        ? countryOptions.find((c) => c.value === field.value)
                            ?.label || "국적 선택"
                        : "국적 선택"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent
                  className="w-full p-0 bg-white"
                  align="start"
                  sideOffset={5}
                >
                  <Command className="rounded-lg border shadow-md">
                    <CommandInput placeholder="국가 검색..." />
                    <CommandEmpty className="py-3 text-center text-sm">
                      검색 결과 없음
                    </CommandEmpty>
                    <CommandGroup className="max-h-60 overflow-y-auto">
                      {countryOptions.map((country) => (
                        <CommandItem
                          key={country.value}
                          value={country.label}
                          onSelect={() => {
                            form.setValue("country", country.value);
                            setOpen(false);
                          }}
                          className="text-black"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              field.value === country.value
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {country.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 성별 */}
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                성별<span className="text-red-500">*</span>
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isLoading}
              >
                <SelectTrigger className="bg-white text-black">
                  <SelectValue
                    placeholder="성별 선택"
                    className="text-gray-500"
                  />
                </SelectTrigger>
                <SelectContent className="bg-white text-black">
                  <SelectItem value="male">남성</SelectItem>
                  <SelectItem value="female">여성</SelectItem>
                  <SelectItem value="other">기타</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 생년월일 */}
        <FormItem>
          <FormLabel>
            생년월일<span className="text-red-500">*</span>
          </FormLabel>
          <div className="grid grid-cols-3 gap-2">
            <FormField
              control={form.control}
              name="birthYear"
              render={({ field }) => (
                <FormControl>
                  <Input
                    {...field}
                    placeholder="YYYY"
                    className="text-black"
                    required
                  />
                </FormControl>
              )}
            />
            <FormField
              control={form.control}
              name="birthMonth"
              render={({ field }) => (
                <FormControl>
                  <Input
                    {...field}
                    placeholder="MM"
                    className="text-black"
                    required
                  />
                </FormControl>
              )}
            />
            <FormField
              control={form.control}
              name="birthDay"
              render={({ field }) => (
                <FormControl>
                  <Input
                    {...field}
                    placeholder="DD"
                    className="text-black"
                    required
                  />
                </FormControl>
              )}
            />
          </div>
          <FormMessage />
        </FormItem>

        {/* 제출 버튼 */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "처리중..." : mode === "signup" ? "가입하기" : "저장"}
        </Button>
      </form>
    </Form>
  );
}
