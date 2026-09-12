import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
});

// 예시: 체류 매칭 추천 요청
export async function getStayRecommendations(payload: unknown) {
  const { data } = await api.post("/api/matching/recommend", payload);
  return data;
}

// 예시: TourAPI 연계 관광지/축제 조회
export async function getTourSpots(areaCode?: string) {
  const { data } = await api.get("/api/matching/tour-spots", {
    params: { area_code: areaCode },
  });
  return data;
}
