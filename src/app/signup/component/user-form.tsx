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
import { t } from "@/lib/i18n";
import { useLanguage } from "@/context/LanguageContext";

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
  const { language } = useLanguage();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* 1줄: 이메일 + 인증번호 전송 */}
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder={t("form.email", language)}
            {...form.register("email")}
            disabled={isEmailVerified}
            className="text-black"
          />
          <Button
            type="button"
            onClick={async () => {
              const email = form.getValues("email");
              if (!email || !email.includes("@")) {
                alert(t("form.invalidEmail", language));
                return;
              }

              setIsVerifying(true);
              try {
                const res = await fetch(
                  `/api/signup?email=${encodeURIComponent(email)}`
                );
                const check = await res.json();
                if (check.exists) {
                  alert(t("form.emailExists", language));
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
                  alert(t("form.sendCode", language));
                } else {
                  alert(data.error || t("form.codeSendFail", language));
                }
              } catch (error) {
                console.error(error);
                alert(t("common.error", language));
              } finally {
                setIsVerifying(false);
              }
            }}
            disabled={isEmailVerified || isVerifying}
          >
            {t("form.sendCode", language)}
          </Button>
        </div>
        {/* 2줄: 인증번호 입력 + 확인 */}
        <div className="flex gap-2 items-center mt-2">
          <Input
            type="text"
            placeholder={t("form.code", language)}
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
                {t("form.verified", language)}
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
                      alert(t("form.verifySuccess", language));
                    } else {
                      alert(data.error || t("form.verifyFail", language));
                    }
                  } catch (error) {
                    console.error(error);
                    alert(t("common.error", language));
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
                {t("form.verify", language)}
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
                {t("form.password", language)}
                <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  placeholder={t("form.password", language)}
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
                {t("form.confirmPassword", language)}
                <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  placeholder={t("form.confirmPassword", language)}
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
                {t("form.nickname", language)}
                <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t("form.nickname", language)}
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
                {t("form.country", language)}
                <span className="text-red-500">*</span>
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
                            ?.label || t("form.selectCountry", language)
                        : t("form.selectCountry", language)}
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
                    <CommandInput
                      placeholder={t("form.searchCountry", language)}
                    />
                    <CommandEmpty className="py-3 text-center text-sm">
                      {t("form.noResult", language)}
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
                {t("form.gender", language)}
                <span className="text-red-500">*</span>
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isLoading}
              >
                <SelectTrigger className="bg-white text-black">
                  <SelectValue
                    placeholder={t("form.gender", language)}
                    className="text-gray-500"
                  />
                </SelectTrigger>
                <SelectContent className="bg-white text-black">
                  <SelectItem value="male">
                    {t("form.gender.male", language)}
                  </SelectItem>
                  <SelectItem value="female">
                    {t("form.gender.female", language)}
                  </SelectItem>
                  <SelectItem value="other">
                    {t("form.gender.other", language)}
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
            {t("form.birthdate", language)}
            <span className="text-red-500">*</span>
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
          {isLoading
            ? t("common.loading", language)
            : mode === "signup"
            ? t("form.submit.signup", language)
            : t("reviewDetail.save", language)}
        </Button>
      </form>
    </Form>
  );
}
