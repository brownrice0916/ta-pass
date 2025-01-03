// // middleware.ts
// import { NextResponse } from "next/server";
// import { getToken } from "next-auth/jwt";
// import { NextRequestWithAuth } from "next-auth/middleware";

// export default async function middleware(request: NextRequestWithAuth) {
//   const token = await getToken({ req: request });

//   // 리뷰 작성 관련 경로에 대한 인증 체크
//   if (request.nextUrl.pathname.startsWith('/reviews/create')) {
//     if (!token) {
//       const loginUrl = new URL("/login", request.url);
//       loginUrl.searchParams.set("callbackUrl", request.url);
//       return NextResponse.redirect(loginUrl);
//     }
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ["/reviews/create/:path*"]
// };
