"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Loader2,
  Key,
  Award,
  RefreshCw,
  Copy,
  Check,
  KeyRound,
  List,
} from "lucide-react";

type SerialNumber = {
  id: string;
  code: string;
  type: string;
  usedAt?: string;
  isUsed: boolean;
  createdAt: string;
};

const SerialNumberSection = () => {
  const [serialNumber, setSerialNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [registeredSerials, setRegisteredSerials] = useState<SerialNumber[]>(
    []
  );
  const [availableSerials, setAvailableSerials] = useState<SerialNumber[]>([]);
  const { data: session, update } = useSession();
  const [apiError, setApiError] = useState<string | null>(null);

  // 생성 관련 상태
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSerials, setGeneratedSerials] = useState<SerialNumber[]>([]);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [count, setCount] = useState(5);
  const [type, setType] = useState("standard");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 내 시리얼 넘버 목록 가져오기
  const fetchMySerialNumbers = async () => {
    try {
      setIsLoading(true);
      setApiError(null);

      console.log("Fetching my serial numbers...");

      const response = await fetch("/api/serial");

      if (!response.ok) {
        if (response.status === 404) {
          console.log(
            "API 엔드포인트가 존재하지 않습니다. 테스트 모드로 전환합니다."
          );
          return; // 404면 API가 없는 것으로 간주하고 빈 배열로 처리
        }

        const errorData = await response.json();
        console.error("Error fetching my serials:", errorData);
        setApiError(
          `시리얼 넘버 목록을 가져오는데 실패했습니다: ${
            errorData.error || response.statusText
          }`
        );
        return;
      }

      const data = await response.json();
      console.log("Fetched my serials:", data);

      setRegisteredSerials(data || []);
      setApiError(null);
    } catch (error) {
      console.error("시리얼 넘버 조회 에러:", error);
      setApiError("시리얼 넘버 조회 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 시리얼 넘버 생성 함수
  const generateSerialNumbers = async () => {
    setIsGenerating(true);
    setGenerateError(null);

    try {
      const response = await fetch("/api/admin/serial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ count, type }),
      });

      // 응답이 404면 테스트 모드로 전환
      if (response.status === 404) {
        console.log(
          "API 엔드포인트가 존재하지 않습니다. 테스트 모드로 진행합니다."
        );

        // 테스트용 시리얼 넘버 생성
        const testSerials = Array.from({ length: count }, (_, i) => ({
          id: `test-${Date.now()}-${i}`,
          code: `TEST-${Math.random()
            .toString(36)
            .substring(2, 6)
            .toUpperCase()}-${Math.random()
            .toString(36)
            .substring(2, 6)
            .toUpperCase()}`,
          type,
          isUsed: false,
          createdAt: new Date().toISOString(),
        }));

        setGeneratedSerials((prev) => [...testSerials, ...prev]);
        setAvailableSerials((prev) => [...testSerials, ...prev]);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "시리얼 넘버 생성에 실패했습니다.");
      }

      const data = await response.json();
      console.log("Generated serials:", data);

      // 생성된 시리얼 번호 표시
      const newSerials = data.serialNumbers || [];
      setGeneratedSerials((prev) => [...newSerials, ...prev]);

      // 사용 가능한 시리얼 목록에도 추가
      setAvailableSerials((prev) => [...newSerials, ...prev]);

      // 불러오기 API 호출 (미사용 시리얼 가져오기)
      fetchUnusedSerialNumbers();
    } catch (err: any) {
      setGenerateError(
        err.message || "시리얼 넘버 생성 중 오류가 발생했습니다."
      );
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // 미사용 시리얼 넘버 목록 가져오기
  const fetchUnusedSerialNumbers = async () => {
    try {
      setIsLoading(true);
      setApiError(null);

      console.log("Fetching unused serial numbers...");

      // 미사용 시리얼 넘버 가져오는 API 호출
      const response = await fetch("/api/admin/serial?isUsed=false&limit=20");

      // 응답이 404면 테스트 모드로 전환
      if (response.status === 404) {
        console.log(
          "API 엔드포인트가 존재하지 않습니다. 테스트 모드로 진행합니다."
        );
        return; // 404면 API가 없는 것으로 간주하고 빈 배열로 처리
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error fetching unused serials:", errorData);
        setApiError(
          `시리얼 넘버 목록을 가져오는데 실패했습니다: ${
            errorData.error || response.statusText
          }`
        );
        return;
      }

      const data = await response.json();
      console.log("Fetched unused serials:", data);

      // 이미 등록된 시리얼 번호는 제외하고 설정
      const registeredCodes = new Set(registeredSerials.map((s) => s.code));
      const unusedSerials = (data.data || []).filter(
        (s: SerialNumber) => !registeredCodes.has(s.code)
      );

      setAvailableSerials(unusedSerials);
      setApiError(null);
    } catch (error) {
      console.error("시리얼 넘버 조회 에러:", error);
      setApiError("시리얼 넘버 조회 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 시리얼 넘버 목록 로드
  useEffect(() => {
    if (session?.user) {
      console.log("Session user detected, fetching serials");
      fetchMySerialNumbers();
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

      // 응답이 404면 테스트 모드로 전환
      if (response.status === 404) {
        console.log(
          "API 엔드포인트가 존재하지 않습니다. 테스트 모드로 진행합니다."
        );

        // 시리얼 번호가 목록에 있는지 확인
        const matchingSerial = availableSerials.find(
          (s) => s.code === serialNumber.trim()
        );

        if (!matchingSerial) {
          setMessage({
            type: "error",
            text: "유효하지 않은 시리얼 넘버입니다.",
          });
          return;
        }

        // 임시 성공 처리 (시연용)
        setMessage({
          type: "success",
          text: `성공! ${
            matchingSerial.type === "premium"
              ? "프리미엄"
              : matchingSerial.type === "lifetime"
              ? "평생회원권"
              : "기본"
          } 멤버십이 활성화되었습니다.`,
        });

        // 등록된 시리얼 넘버를 목록에 추가
        const newSerial = {
          ...matchingSerial,
          usedAt: new Date().toISOString(),
          isUsed: true,
        };

        setRegisteredSerials((prev) => [newSerial, ...prev]);

        // 사용 가능한 시리얼 목록과 생성된 시리얼 목록에서 제거
        setAvailableSerials((prev) =>
          prev.filter((s) => s.code !== serialNumber.trim())
        );
        setGeneratedSerials((prev) =>
          prev.filter((s) => s.code !== serialNumber.trim())
        );

        // 멤버십 타입 업데이트 (세션 업데이트)
        if (session && update) {
          await update({
            ...session,
            user: {
              ...session?.user,
              membershipType: matchingSerial.type,
            },
          });
        }

        // 테스트 모드로 진행
        setSerialNumber("");
        return;
      }

      // 일반 API 응답 처리
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
      fetchMySerialNumbers();

      // 사용 가능한 시리얼 목록에서 제거
      setAvailableSerials((prev) =>
        prev.filter((s) => s.code !== serialNumber.trim())
      );
      setGeneratedSerials((prev) =>
        prev.filter((s) => s.code !== serialNumber.trim())
      );
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

  // 시리얼 넘버 클릭 시 입력 필드에 채우기
  const handleSerialClick = (code: string) => {
    setSerialNumber(code);
    setMessage({ type: "", text: "" });
  };

  // 시리얼 넘버 복사 기능
  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000); // 2초 후 복사 표시 제거
    });
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
    <div className="w-full">
      <h2 className="text-xl font-bold mb-4">시리얼 넘버 관리</h2>

      {/* 시리얼 넘버 등록 섹션 */}
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

        {/* 사용 가능한 시리얼 넘버 목록 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-600">
              사용 가능한 시리얼 넘버
            </h4>
            <button
              onClick={fetchUnusedSerialNumbers}
              className="text-xs text-blue-500 flex items-center"
              disabled={isLoading}
            >
              <RefreshCw
                className={`w-3 h-3 mr-1 ${isLoading ? "animate-spin" : ""}`}
              />
              불러오기
            </button>
          </div>

          {availableSerials.length > 0 ? (
            <div className="bg-gray-50 p-2 rounded-md max-h-40 overflow-y-auto">
              <ul className="space-y-1">
                {availableSerials.map((serial) => (
                  <li
                    key={serial.id}
                    className="text-sm border-b pb-1 cursor-pointer hover:bg-gray-100 p-1 rounded flex justify-between items-center"
                  >
                    <span
                      className="flex-1"
                      onClick={() => handleSerialClick(serial.code)}
                    >
                      <code className="font-mono">{serial.code}</code>
                      <span className="text-xs text-gray-500 ml-2">
                        ({getMembershipLabel(serial.type)})
                      </span>
                    </span>
                    <button
                      onClick={() => copyToClipboard(serial.code, serial.id)}
                      className="text-gray-500 hover:text-blue-500 p-1"
                      title="복사하기"
                    >
                      {copiedId === serial.id ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
              사용 가능한 시리얼 넘버가 없습니다. '불러오기'를 클릭하거나
              아래에서 새로 생성하세요.
            </p>
          )}
        </div>

        {/* 등록된 시리얼 넘버 목록 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-600">
              내 시리얼 넘버
            </h4>
            <button
              onClick={fetchMySerialNumbers}
              className="text-xs text-blue-500 flex items-center"
              disabled={isLoading}
            >
              <RefreshCw
                className={`w-3 h-3 mr-1 ${isLoading ? "animate-spin" : ""}`}
              />
              새로고침
            </button>
          </div>

          {registeredSerials.length > 0 ? (
            <ul className="space-y-2">
              {registeredSerials.map((serial) => (
                <li key={serial.id} className="border-b pb-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-mono text-sm">{serial.code}</p>
                      <p className="text-xs text-gray-500">
                        유형: {getMembershipLabel(serial.type)} | 등록일:{" "}
                        {new Date(
                          serial.usedAt || serial.createdAt
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      활성
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">
              등록된 시리얼 넘버가 없습니다.
            </p>
          )}
        </div>
      </div>

      {/* 시리얼 넘버 생성 섹션 */}
      <div className="mt-4 p-4 bg-white rounded-lg shadow-md">
        <div className="flex items-center mb-3">
          <KeyRound className="w-5 h-5 mr-2 text-blue-500" />
          <h3 className="text-lg font-semibold">시리얼 넘버 생성 (테스트용)</h3>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              개수
            </label>
            <div className="flex">
              <button
                className="bg-gray-200 px-3 py-1 rounded-l-md"
                onClick={() => setCount((prev) => Math.max(1, prev - 1))}
                disabled={count <= 1}
              >
                -
              </button>
              <input
                type="number"
                value={count}
                onChange={(e) =>
                  setCount(
                    Math.min(10, Math.max(1, parseInt(e.target.value) || 1))
                  )
                }
                className="w-12 text-center border-y"
                min="1"
                max="10"
              />
              <button
                className="bg-gray-200 px-3 py-1 rounded-r-md"
                onClick={() => setCount((prev) => Math.min(10, prev + 1))}
                disabled={count >= 10}
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              타입
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border rounded-md p-2"
            >
              <option value="standard">기본</option>
              <option value="premium">프리미엄</option>
              <option value="lifetime">평생회원권</option>
            </select>
          </div>
        </div>

        <button
          onClick={generateSerialNumbers}
          className="mb-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300 flex items-center justify-center"
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              생성 중...
            </>
          ) : (
            <>
              <KeyRound className="w-4 h-4 mr-2" />
              시리얼 넘버 생성
            </>
          )}
        </button>

        {generateError && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md">
            {generateError}
          </div>
        )}

        {generatedSerials.length > 0 && (
          <div>
            <div className="flex items-center mb-2">
              <List className="w-4 h-4 mr-2 text-gray-500" />
              <h4 className="font-medium text-gray-700">생성된 시리얼 넘버</h4>
            </div>
            <div className="bg-gray-50 p-3 rounded-md max-h-60 overflow-y-auto">
              <ul className="space-y-2">
                {generatedSerials.map((serial) => (
                  <li
                    key={serial.id}
                    className="flex items-center justify-between border-b pb-2"
                  >
                    <div>
                      <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {serial.code}
                      </code>
                      <span className="ml-2 text-xs text-gray-500">
                        {getMembershipLabel(serial.type)}
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(serial.code, serial.id)}
                      className="text-gray-500 hover:text-blue-500 p-1"
                      title="복사하기"
                    >
                      {copiedId === serial.id ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              * 시리얼 넘버는 복사하여 위 입력란에 붙여넣으면 사용할 수
              있습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SerialNumberSection;
