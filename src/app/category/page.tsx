"use client";
// app/category/page.tsx
import dynamic from "next/dynamic";

const Category = dynamic(() => import("./component/category"), { ssr: false }); // ✅ CSR 컴포넌트로 강제 처리

export default function Page() {
  return <Category />;
}
