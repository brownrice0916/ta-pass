// components/UserForm.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useState } from "react";
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

export function UserForm({
  form,
  onSubmit,
  isLoading,
  mode,
  onEmailCheck,
}: UserFormProps) {
  const [open, setOpen] = useState(false);

  // countries-list 패키지의 데이터를 가공
  const countryOptions = Object.entries(countries).map(([code, country]) => ({
    value: code.toLowerCase(),
    label: country.name,
  }));

  // 알파벳 순으로 정렬
  countryOptions.sort((a, b) => a.label.localeCompare(b.label));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* 이메일 */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                이메일<span className="text-red-500">*</span>
              </FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="이메일을 입력하세요"
                    className="placeholder:text-gray-400 text-black"
                    readOnly={mode === "edit"}
                    disabled={mode === "edit"}
                    required
                  />
                </FormControl>
                {mode === "signup" && onEmailCheck && (
                  <Button
                    type="button"
                    className="shrink-0"
                    disabled={!field.value || isLoading}
                    onClick={onEmailCheck}
                  >
                    중복확인
                  </Button>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

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
                  placeholder={"비밀번호(최소 8자리 이상)"}
                  className="placeholder:text-gray-400 text-black"
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
                  placeholder={"비밀번호를 다시 입력하세요"}
                  className="placeholder:text-gray-400 text-black"
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
                  placeholder="닉네임"
                  className="placeholder:text-gray-400 text-black"
                  required
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 국적 - 콤보박스 */}
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
                      aria-expanded={open}
                      className={cn(
                        "w-full justify-between bg-white text-black",
                        !field.value && "text-gray-500"
                      )}
                      disabled={isLoading}
                    >
                      {field.value
                        ? countryOptions.find(
                            (country) => country.value === field.value
                          )?.label || "국적 선택"
                        : "국적 선택"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                      검색 결과가 없습니다
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
                    className="placeholder:text-gray-400 text-black"
                    placeholder="YYYY"
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
                    className="placeholder:text-gray-400 text-black"
                    placeholder="MM"
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
                    className="placeholder:text-gray-400 text-black"
                    placeholder="DD"
                    required
                  />
                </FormControl>
              )}
            />
          </div>
          <FormMessage />
        </FormItem>

        {/* 버튼 */}
        {mode === "signup" ? (
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "처리중..." : "가입하기"}
          </Button>
        ) : (
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => window.history.back()}
            >
              취소
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? "저장 중..." : "저장"}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
