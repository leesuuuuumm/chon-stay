import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
});

export type AuthUser = {
  id: number;
  email: string;
  username: string;
  created_date: string;
};

// 백엔드 라우트 이름이 "/singup" (오타)으로 되어 있어 그대로 맞춰 호출한다.
export async function signup(payload: { email: string; password: string; username: string }) {
  const { data } = await api.post<AuthUser>("/api/users/singup", payload);
  return data;
}

export async function login(payload: { email: string; password: string }) {
  const { data } = await api.post<{ access_token: string; token_type: string }>(
    "/api/users/login",
    payload
  );
  return data;
}

export async function fetchMe(token: string) {
  const { data } = await api.get<AuthUser>("/api/users/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

// 백엔드 에러 응답({detail: "..."}) 메시지를 안전하게 뽑아낸다.
export function extractErrorMessage(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (!err.response) return "서버에 연결할 수 없어요. 잠시 후 다시 시도해주세요.";
  }
  return fallback;
}

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
