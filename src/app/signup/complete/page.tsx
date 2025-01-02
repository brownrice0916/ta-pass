"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function SignUpCompletePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // 로딩 상태 처리 (옵션)
  if (status === "loading") {
    return <div>로딩 중...</div>;
  }

  // 로그인되지 않은 경우 처리 (옵션)
  if (!session?.user) {
    return <div>로그인 정보가 없습니다.</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[393px] min-h-screen flex flex-col">
        <main className="flex-1 p-4">
          <Card className="mt-8">
            <CardContent className="pt-6 text-center space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">안녕하세요</h2>
                {/* 유저 이름 출력 */}
                <h3 className="text-xl font-bold">{session.user.name}!</h3>
                <p className="text-muted-foreground">
                  회원가입이 완료되었습니다
                </p>
              </div>

              <div className="bg-primary text-primary-foreground p-6 rounded-lg space-y-4">
                <h4 className="text-lg font-semibold">
                  TA PASS와 함께하는 첫 여행!
                </h4>
                <p className="text-sm">지금 바로 스마트한 여행을 시작하세요</p>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => router.push("/")}
                >
                  TA PASS 체험하기
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
