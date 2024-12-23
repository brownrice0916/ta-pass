"use client";

import { useRouter } from "next/navigation";
import React from "react";

const TestPage = () => {
  const router = useRouter();

  const handleButtonClick = () => {
    router.push("/new_location");
  };

  return <button onClick={handleButtonClick}>클릭슨</button>;
};

export default TestPage;
