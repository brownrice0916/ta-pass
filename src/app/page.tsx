import Main from "@/components/main";
import { Suspense } from "react";

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Main />
    </Suspense>
  );
}
