// 백엔드(TourAPI·인구지표 연동)가 준비되기 전까지 화면 흐름을 검증하기 위한 목데이터입니다.
// 실제 데이터 연동 시 src/lib/api.ts 의 함수 호출 결과로 대체하세요.

export type Interest = "농사체험" | "공방·수공예" | "휴양·힐링" | "자연체험";

export const INTERESTS: Interest[] = ["농사체험", "공방·수공예", "휴양·힐링", "자연체험"];

export type Duration = "당일" | "1박2일" | "한달살이";

export const DURATIONS: Duration[] = ["당일", "1박2일", "한달살이"];

export type Experience = {
  id: string;
  title: string;
  season: string;
  price: number;
};

export type Lodging = {
  id: string;
  title: string;
  unit: string;
  price: number;
};

export type TourSpot = {
  id: string;
  title: string;
  category: string;
};

export type Notice = {
  id: string;
  author: string;
  content: string;
  createdAt: string;
};

export type Review = {
  id: string;
  author: string;
  rating: number;
  content: string;
  reply?: string;
};

export type Village = {
  id: string;
  name: string;
  matchTag: string;
  matchPercent: number;
  interestTags: Interest[];
  urgency: "high" | "medium" | "low"; // 생활인구 유입 시급도
  urgencyLabel?: string;
  populationIndex: number; // 인구감소 심각도 (100에 가까울수록 심각)
  description: string;
  experiences: Experience[];
  lodgings: Lodging[];
  tourSpots: TourSpot[];
  reviews: Review[];
  notices: Notice[];
  calendar: { date: string; label: string }[];
};

export const VILLAGES: Village[] = [
  {
    id: "yangji",
    name: "양지리 두레마을",
    matchTag: "농사체험 원하시는군요",
    matchPercent: 92,
    interestTags: ["농사체험", "자연체험"],
    urgency: "high",
    urgencyLabel: "방문객 유입이 특히 필요한 마을",
    populationIndex: 88,
    description:
      "두레 정신으로 함께 농사짓는 마을. 모내기부터 장 담그기까지 사계절 체험이 이어집니다.",
    experiences: [
      { id: "yangji-1", title: "모내기 체험", season: "봄", price: 20000 },
      { id: "yangji-2", title: "전통 장 담그기", season: "가을", price: 30000 },
      { id: "yangji-3", title: "가을 수확 체험", season: "가을", price: 25000 },
    ],
    lodgings: [{ id: "yangji-l1", title: "두레민박", unit: "1박", price: 60000 }],
    tourSpots: [
      { id: "ts-1", title: "인근 저수지 둘레길", category: "관광지" },
      { id: "ts-2", title: "양지리 가을 축제", category: "축제" },
    ],
    reviews: [
      {
        id: "r1",
        author: "김OO",
        rating: 5,
        content: "정말 정겨운 시간이었어요!",
        reply: "다음에 또 뵈어요, 감사합니다 :)",
      },
      { id: "r2", author: "이OO", rating: 4, content: "아이와 함께 모내기 체험, 잊지 못할 추억이에요." },
    ],
    notices: [
      { id: "n1", author: "이장님", content: "이번 주말 수확체험이 시작됩니다. 많은 참여 부탁드려요!", createdAt: "5/10" },
    ],
    calendar: [
      { date: "5/12 (월)", label: "모내기 체험 · 2인" },
      { date: "5/14 (수)", label: "장 담그기 · 4인" },
    ],
  },
  {
    id: "solmoe",
    name: "solmoe 솔뫼마을",
    matchTag: "휴양·힐링 추천",
    matchPercent: 88,
    interestTags: ["휴양·힐링", "자연체험"],
    urgency: "medium",
    populationIndex: 61,
    description: "소나무 숲에 둘러싸인 조용한 마을. 명상과 산책, 느린 하루를 위한 휴양 프로그램이 있습니다.",
    experiences: [
      { id: "solmoe-1", title: "숲속 명상 프로그램", season: "사계절", price: 15000 },
      { id: "solmoe-2", title: "다도 체험", season: "사계절", price: 18000 },
    ],
    lodgings: [{ id: "solmoe-l1", title: "솔뫼 한옥스테이", unit: "1박", price: 80000 }],
    tourSpots: [{ id: "ts-3", title: "솔뫼 소나무 숲길", category: "관광지" }],
    reviews: [{ id: "r3", author: "박OO", rating: 5, content: "소나무 향기 가득한 힐링 그 자체였어요." }],
    notices: [],
    calendar: [{ date: "5/18 (일)", label: "숲속 명상 · 3인" }],
  },
  {
    id: "daesup",
    name: "대숲마을",
    matchTag: "자연체험 추천",
    matchPercent: 81,
    interestTags: ["자연체험", "공방·수공예"],
    urgency: "low",
    populationIndex: 42,
    description: "대나무 숲과 손끝의 정성이 만나는 마을. 죽공예 공방 체험이 인기입니다.",
    experiences: [{ id: "daesup-1", title: "대나무 소품 공예", season: "사계절", price: 22000 }],
    lodgings: [{ id: "daesup-l1", title: "대숲 게스트하우스", unit: "1박", price: 55000 }],
    tourSpots: [{ id: "ts-4", title: "대숲 둘레길", category: "관광지" }],
    reviews: [],
    notices: [],
    calendar: [],
  },
];

export function getVillage(id: string) {
  return VILLAGES.find((v) => v.id === id);
}

// 마을 주민/이장 대시보드 목데이터 (양지리 두레마을 기준)
export const HOST_VILLAGE = VILLAGES[0];

export type ReservationRequest = {
  id: string;
  applicant: string;
  people: number;
  detail: string;
  capacityNote?: string;
  status: "pending" | "approved" | "rejected";
};

export const HOST_RESERVATIONS: ReservationRequest[] = [
  {
    id: "req-1",
    applicant: "김OO",
    people: 2,
    detail: "모내기 2일 + 두레민박 1박",
    status: "pending",
  },
  {
    id: "req-2",
    applicant: "이OO",
    people: 4,
    detail: "장 담그기 체험",
    capacityNote: "정원 6/10",
    status: "pending",
  },
];

export const HOST_STATS = {
  newReservations: 3,
  todayVisits: 2,
  unreadReviews: 5,
};

export const HOST_INSIGHTS = {
  visitTrend: [30, 42, 38, 55, 78],
  revisitRate: 38,
  avgRating: 4.7,
};

export const COMMUNITY_POSTS = [
  { id: "cp-1", title: "재방문자 소통방", count: 4 },
];
