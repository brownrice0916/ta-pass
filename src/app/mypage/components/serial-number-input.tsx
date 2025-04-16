"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Key, Award } from "lucide-react";

type SerialNumber = {
  id: string;
  code: string;
  type: string;
  usedAt: string;
  isUsed: boolean;
};

const SerialNumberInput = () => {
  const [serialNumber, setSerialNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [registeredSerials, setRegisteredSerials] = useState<SerialNumber[]>(
    []
  );
  const { data: session, update } = useSession();
  const [apiError, setApiError] = useState<string | null>(null);

  const fetchRegisteredSerials = async () => {
    try {
      console.log("Fetching serials...");
      const response = await fetch("/api/serial");

      console.log("Response status:", response.status);
      console.log(
        "Response headers:",
        Object.fromEntries([...response.headers])
      );

      // 응답을 텍스트로 먼저 가져와서 확인
      const text = await response.text();
      console.log("Response text:", text);

      // 텍스트가 JSON인지 확인
      try {
        const data = JSON.parse(text);
        console.log("Parsed data:", data);
        setRegisteredSerials(data);
      } catch (e) {
        console.error("Failed to parse JSON:", e);
        setApiError("응답을 처리하는 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("시리얼 넘버 조회 에러:", error);
      setApiError("시리얼 넘버 조회 중 오류가 발생했습니다.");
    }
  };
  // 컴포넌트 마운트 시 등록된 시리얼 넘버 목록 가져오기
  useEffect(() => {
    if (session?.user) {
      console.log("Session user detected, fetching serials");
      fetchRegisteredSerials();
    }
  }, [session]);

  // 시리얼 넘버 등록 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!serialNumber.trim()) {
      setMessage({ type: "error", text: "시리얼 넘버를 입력해주세요." });
      return;
    }

    setIsSubmitting(true);
    setMessage({ type: "", text: "" });
    setApiError(null);

    try {
      console.log("Submitting serial number:", serialNumber.trim());
      const response = await fetch("/api/serial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: serialNumber.trim() }),
      });

      console.log("API Response status:", response.status);
      const data = await response.json();
      console.log("API Response data:", data);

      if (!response.ok) {
        throw new Error(data.error || "시리얼 넘버 등록에 실패했습니다.");
      }

      // 성공 메시지 설정
      setMessage({
        type: "success",
        text: `성공! ${
          data.type === "premium"
            ? "프리미엄"
            : data.type === "lifetime"
            ? "평생회원권"
            : "기본"
        } 멤버십이 활성화되었습니다.`,
      });

      // 입력 필드 초기화
      setSerialNumber("");

      // 세션 업데이트 (멤버십 상태 반영)
      if (session && update) {
        await update({
          ...session,
          user: {
            ...session?.user,
            membershipType: data.type,
          },
        });
      }

      // 등록된 시리얼 넘버 목록 새로고침
      fetchRegisteredSerials();
    } catch (error: any) {
      console.error("시리얼 넘버 등록 오류:", error);
      setMessage({
        type: "error",
        text: error.message || "시리얼 넘버 등록 중 오류가 발생했습니다.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 멤버십 타입 표시 헬퍼 함수
  const getMembershipLabel = (type: string = "free") => {
    switch (type) {
      case "premium":
        return "프리미엄";
      case "lifetime":
        return "평생회원권";
      case "standard":
        return "기본";
      default:
        return "무료";
    }
  };

  return (
    <div className="w-full bg-white p-4 rounded-lg shadow-md mb-4">
      <div className="flex items-center mb-3">
        <Key className="w-5 h-5 mr-2 text-blue-500" />
        <h3 className="text-lg font-semibold">시리얼 넘버 등록</h3>
      </div>

      {/* 현재 멤버십 상태 표시 */}
      <div className="bg-blue-50 p-3 rounded-md mb-4 flex items-center">
        <Award className="w-5 h-5 mr-2 text-blue-500" />
        <div>
          <p className="text-sm text-gray-600">현재 멤버십</p>
          <p className="font-medium">
            {getMembershipLabel(session?.user?.membershipType as string)}
          </p>
        </div>
      </div>

      {/* API 오류 표시 */}
      {apiError && (
        <div className="bg-red-100 text-red-700 p-2 rounded mb-4">
          {apiError}
        </div>
      )}

      {/* 시리얼 넘버 입력 폼 */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex items-center">
          <input
            type="text"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            placeholder="시리얼 넘버를 입력하세요"
            className="flex-1 p-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "등록"
            )}
          </button>
        </div>

        {/* 메시지 표시 */}
        {message.text && (
          <div
            className={`mt-2 p-2 rounded ${
              message.type === "error"
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {message.text}
          </div>
        )}
      </form>

      {/* 등록된 시리얼 넘버 목록 */}
      {registeredSerials.length > 0 ? (
        <div>
          <h4 className="text-sm font-medium text-gray-600 mb-2">
            등록된 시리얼 넘버
          </h4>
          <ul className="space-y-2">
            {registeredSerials.map((serial) => (
              <li key={serial.id} className="border-b pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-mono text-sm">{serial.code}</p>
                    <p className="text-xs text-gray-500">
                      유형: {getMembershipLabel(serial.type)} | 등록일:{" "}
                      {new Date(serial.usedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    활성
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-gray-500">등록된 시리얼 넘버가 없습니다.</p>
      )}
    </div>
  );
};

export default SerialNumberInput;
