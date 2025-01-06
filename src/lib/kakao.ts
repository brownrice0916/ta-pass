// lib/kakao.ts
export async function getRegionInfo(latitude: number, longitude: number) {
    try {
      const response = await fetch(
        `https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=${longitude}&y=${latitude}`,
        {
          headers: {
            Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
          },
        }
      );
      
      const data = await response.json();
      const regionInfo = data.documents[0];
      
      return {
        region1: regionInfo.region_1depth_name,  // 시/도
        region2: regionInfo.region_2depth_name,  // 구/군
        region3: regionInfo.region_3depth_name,  // 동/읍/면
        region4: regionInfo.region_4depth_name   // 세부 지역명
      };
    } catch (error) {
      console.error("Error fetching region info:", error);
      return null;
    }
  }