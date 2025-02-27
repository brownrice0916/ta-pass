// src/lib/types.ts
export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string | null; // 이미지 필드 추가
}
