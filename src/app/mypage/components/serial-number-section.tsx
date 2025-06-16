"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Loader2, RefreshCw, Copy, Check, KeyRound, List } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { SerialNumber } from "@prisma/client";
import { useLanguage } from "@/context/LanguageContext";
import { t } from "@/lib/i18n";

const SerialNumberSection = () => {
  const [serialNumber, setSerialNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [registeredSerials, setRegisteredSerials] = useState<SerialNumber[]>(
    []
  );
  const [availableSerials, setAvailableSerials] = useState<SerialNumber[]>([]);
  const { data: session } = useSession();
  const { language } = useLanguage();

  const [isLoadingSerial, setIsLoadingSerial] = useState(false);
  const [registeredSerial, setRegisteredSerial] = useState<SerialNumber | null>(
    null
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExpandSerial, setIsExpandSerial] = useState(false);

  const ADMIN_EMAILS = [
    "brownrice0916@gmail.com",
    "rice@naver.com",
    "dergelbefluss@gmail.com",
  ];

  const isAdmin = ADMIN_EMAILS.includes(session?.user.email || "");
  const isActive = registeredSerial;
  const serialCode = registeredSerial?.code || "-";
  const userImage = session?.user?.image || "/avatar/default-user.png";
  const serialCardBg = isActive
    ? "/pass/pass-bg-green_old.png"
    : "/pass/pass-bg-gray_old.png";

  useEffect(() => {
    fetchRegisteredSerial();
  }, []);

  const fetchRegisteredSerial = async () => {
    try {
      const res = await fetch("/api/serial");
      if (!res.ok) throw new Error("Failed to fetch serial number");
      const data = await res.json();
      setRegisteredSerial(data[0] || null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingSerial(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialNumber.trim()) {
      setMessage({ type: "error", text: t("serial.inputRequired", language) });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/serial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: serialNumber }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: "success", text: data.message });
      setSerialNumber("");
      fetchRegisteredSerial();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const formatDateWithDday = (dateStr: string) => {
    const target = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.ceil(
      (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    const formattedDate = target.toISOString().split("T")[0].replace(/-/g, ".");
    return `${formattedDate} (D-${diffDays})`;
  };

  if (!isLoadingSerial) return null;

  return (
    <div className="w-full">
      <div
        className="rounded-2xl text-center w-[100%] h-[405px] p-6 pt-16 mb-4 relative overflow-hidden"
        style={{
          backgroundImage: `url(${serialCardBg})`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
      >
        <h2 className="text-lg font-semibold mb-5 text-[27px]">
          {t("serial.myPass", language)}
        </h2>
        <h1
          className="text-4xl mb-10 text-[56px] font-extrabold tracking-tight"
          style={{ WebkitTextStroke: "1px black" }}
        >
          {isActive ? "ACTIVE" : "INACTIVE"}
        </h1>
        {isActive ? (
          <div className="font-bold">
            <p>
              {t("serial.serialNumber", language)} : {serialCode}
            </p>
            <p>
              {t("serial.expiration", language)}: ~{" "}
              {registeredSerial?.expiresAt
                ? formatDateWithDday(registeredSerial.activatedUntil as any)
                : t("serial.noExpiration", language)}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="text-[20px] mb-3 font-bold">
              {t("serial.registerSerial", language)}
            </p>
            <div className="flex">
              <input
                type="text"
                placeholder={t("serial.inputPlaceholder", language)}
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full h-full px-3 py-2 rounded-md mr-2 text-black mb-2"
                disabled={isSubmitting}
              />
              <Button type="submit" className="h-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t("serial.activate", language)
                )}
              </Button>
            </div>
            {message.text && (
              <p
                className={`mt-2 text-sm text-center ${
                  message.type === "error" ? "text-red-500" : "text-green-500"
                }`}
              >
                {message.text}
              </p>
            )}
          </form>
        )}
        <div className="mt-4 text-left flex items-center gap-3 absolute bottom-5 left-7">
          <Image
            src={userImage}
            alt="user"
            width={40}
            height={40}
            className="rounded-full object-cover"
          />
          <div>
            <p className="text-sm">{session?.user?.name || "-"}</p>
            <a href="/account" className="text-sm text-gray-500 mt-2">
              {t("serial.accountManage", language)} &gt;
            </a>
          </div>
        </div>
      </div>

      {isAdmin && (
        <p
          className="cursor-pointer"
          onClick={() => setIsExpandSerial(!isExpandSerial)}
        >
          👀
        </p>
      )}

      {/* 어드민 확장 영역은 생략 */}
    </div>
  );
};

export default SerialNumberSection;
