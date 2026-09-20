import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      try {
        window.localStorage.removeItem('chonstay:v1');
      } catch {
        // ignore
      }
      if (
        typeof window !== 'undefined' &&
        window.location.pathname !== '/login'
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

// 백엔드가 내려주는 image_path는 "/media/..." 형태의 상대 경로라 API 서버 주소를 붙여줘야 한다.
export function resolveImageUrl(imagePath: string) {
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  return `${api.defaults.baseURL}${imagePath}`;
}
export type AuthUser = {
  id: number;
  email: string;
  username: string;
  is_admin: boolean;
  created_date: string;
};

export type VillageApplication = {
  id: number;
  representative_name: string;
  phone: string;
  email: string;
  registration_number: string;
  document_path: string;
  status: 'pending' | 'approved' | 'rejected';
  name: string | null;
  description: string | null;
  image_path: string | null;
  created_date: string;
};

// 백엔드 라우트 "/signup"에 맞춰 호출한다.
export async function signup(payload: {
  email: string;
  password: string;
  username: string;
}) {
  const { data } = await api.post<AuthUser>('/api/users/signup', payload);
  return data;
}

export async function login(payload: { email: string; password: string }) {
  const { data } = await api.post<{ access_token: string; token_type: string }>(
    '/api/users/login',
    payload,
  );
  return data;
}

export async function signupVillage(
  token: string,
  payload: {
    representativeName: string;
    phone: string;
    registrationNumber: string;
    document: File;
  },
) {
  const formData = new FormData();
  formData.append('representative_name', payload.representativeName);
  formData.append('phone', payload.phone);
  formData.append('registration_number', payload.registrationNumber);
  formData.append('document', payload.document);

  const { data } = await api.post<VillageApplication>(
    '/api/villages/signup',
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return data;
}

export async function fetchMyVillageApplication(token: string) {
  try {
    const { data } = await api.get<VillageApplication>(
      '/api/villages/my-application',
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      return null;
    }
    throw err;
  }
}

export async function updateMyVillageProfile(
  token: string,
  payload: { name: string; description: string },
) {
  const { data } = await api.patch<VillageApplication>(
    '/api/villages/me',
    payload,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return data;
}

export async function uploadMyVillagePhoto(token: string, photo: File) {
  const formData = new FormData();
  formData.append('photo', photo);
  const { data } = await api.post<VillageApplication>(
    '/api/villages/me/photo',
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return data;
}

export type ListingImage = {
  id: number;
  image_path: string;
  is_cover: boolean;
};

export type InterestCode = 'FARMING' | 'CRAFT' | 'HEALING' | 'NATURE';

export const INTEREST_OPTIONS: { code: InterestCode; label: string }[] = [
  { code: 'FARMING', label: '농사체험' },
  { code: 'CRAFT', label: '공방·수공예' },
  { code: 'HEALING', label: '휴양·힐링' },
  { code: 'NATURE', label: '자연체험' },
];

export type ExperienceListing = {
  id: number;
  village_id: number;
  title: string;
  start_date: string;
  end_date: string;
  price: number;
  capacity: number;
  interests: InterestCode[];
  created_date: string;
  images: ListingImage[];
};

export type LodgingListing = {
  id: number;
  village_id: number;
  title: string;
  unit: string;
  price: number;
  capacity: number;
  created_date: string;
  images: ListingImage[];
};

export async function createExperience(
  token: string,
  payload: {
    title: string;
    startDate: string;
    endDate: string;
    price: number;
    capacity: number;
    interests: InterestCode[];
  },
) {
  const { data } = await api.post<ExperienceListing>(
    '/api/listings/experiences',
    {
      title: payload.title,
      start_date: payload.startDate,
      end_date: payload.endDate,
      price: payload.price,
      capacity: payload.capacity,
      interests: payload.interests,
    },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return data;
}

export async function createLodging(
  token: string,
  payload: { title: string; unit: string; price: number; capacity: number },
) {
  const { data } = await api.post<LodgingListing>(
    '/api/listings/lodgings',
    payload,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return data;
}

export async function uploadExperienceImages(
  token: string,
  experienceId: number,
  files: File[],
  coverIndex: number,
) {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  formData.append('cover_index', String(coverIndex));
  const { data } = await api.post<ListingImage[]>(
    `/api/listings/experiences/${experienceId}/images`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return data;
}

export async function uploadLodgingImages(
  token: string,
  lodgingId: number,
  files: File[],
  coverIndex: number,
) {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  formData.append('cover_index', String(coverIndex));
  const { data } = await api.post<ListingImage[]>(
    `/api/listings/lodgings/${lodgingId}/images`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return data;
}

export async function fetchMyListings(token: string) {
  const { data } = await api.get<{
    experiences: ExperienceListing[];
    lodgings: LodgingListing[];
  }>('/api/listings/mine', { headers: { Authorization: `Bearer ${token}` } });
  return data;
}

export async function fetchMe(token: string) {
  const { data } = await api.get<AuthUser>('/api/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

export async function listVillageApplications(token: string) {
  const { data } = await api.get<VillageApplication[]>('/api/villages/', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

export async function fetchVillageDocumentUrl(
  villageId: number,
  token: string,
) {
  const { data } = await api.get(`/api/villages/${villageId}/document`, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob',
  });
  return URL.createObjectURL(data as Blob);
}

export async function approveVillageApplication(
  villageId: number,
  token: string,
) {
  const { data } = await api.post<VillageApplication>(
    `/api/villages/${villageId}/approve`,
    null,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return data;
}

export async function rejectVillageApplication(
  villageId: number,
  token: string,
) {
  const { data } = await api.post<VillageApplication>(
    `/api/villages/${villageId}/reject`,
    null,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return data;
}

// 백엔드 에러 응답({detail: "..."}) 메시지를 안전하게 뽑아낸다.
export function extractErrorMessage(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (!err.response)
      return '서버에 연결할 수 없어요. 잠시 후 다시 시도해주세요.';
  }
  return fallback;
}

// 예시: 체류 매칭 추천 요청
export async function getStayRecommendations(payload: unknown) {
  const { data } = await api.post('/api/matching/recommend', payload);
  return data;
}

// 예시: TourAPI 연계 관광지/축제 조회
export async function getTourSpots(areaCode?: string) {
  const { data } = await api.get('/api/matching/tour-spots', {
    params: { area_code: areaCode },
  });
  return data;
}

export type VillageRecommendation = {
  village_id: number;
  village_name: string;
  explanation: string;
  matching_score: number;
  alert: boolean;
  image_path?: string | null;
};

export type OnboardingResponse = {
  onboarding_id: number;
  recommendations: VillageRecommendation[];
};

export async function getOnboardingRecommendations(
  token: string,
  payload: { interests: string[]; duration: string },
) {
  const { data } = await api.post<OnboardingResponse>(
    '/api/onboarding/recommend',
    payload,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return data;
}

export type VillageExperience = {
  id: number;
  title: string;
  season: string | null;
  start_date: string;
  end_date: string;
  price: number;
  capacity: number;
  images: ListingImage[];
};

export type VillageLodging = {
  id: number;
  title: string;
  unit: string;
  price: number;
  capacity: number;
  images: ListingImage[];
};

export type VillageDetail = {
  id: number;
  name: string;
  description: string | null;
  image_path: string | null;
  experiences: VillageExperience[];
  lodgings: VillageLodging[];
};

export type BookingItemPayload = {
  quantity: number;
  unit_price: number;
  subtotal: number;
  experience_id?: number;
  lodging_id?: number;
  check_in?: string;
  check_out?: string;
};

export type BookingPayload = {
  village_id: number;
  headcount: number;
  visit_date?: string;
  total_price: number;
  items: BookingItemPayload[];
  coupon_id?: number;
};

export async function createBooking(token: string, payload: BookingPayload) {
  const { data } = await api.post<{
    booking_id: number;
    status: BookingStatus;
    total_price: number;
    discount_amount: number;
  }>('/api/bookings/', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

export type CouponStatus = 'available' | 'used' | 'expired';

export type Coupon = {
  id: number;
  code: string;
  title: string;
  discount_percent: number;
  applies_to: 'all' | 'lodging';
  status: CouponStatus;
  issued_at: string;
  expires_at: string;
  used_at: string | null;
};

export async function fetchMyCoupons(token: string) {
  const { data } = await api.get<Coupon[]>('/api/coupons/mine', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

export async function getLodgingUnavailableDates(lodgingId: number) {
  const { data } = await api.get<{ dates: string[] }>(
    `/api/listings/lodgings/${lodgingId}/unavailable-dates`,
  );
  return data.dates;
}

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type HostBookingItem = {
  type: 'experience' | 'lodging';
  title: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  start_date?: string | null;
  end_date?: string | null;
};

export type HostBooking = {
  id: number;
  status: BookingStatus;
  headcount: number;
  start_date: string;
  end_date: string;
  total_price: number;
  requested_at: string;
  decided_at: string | null;
  applicant_name: string;
  discount_amount: number;
  items: HostBookingItem[];
};

export const REVIEW_MAX_LENGTH = 200;

export type MyReview = {
  id: number;
  rating: number;
  comment: string;
  created_date: string;
};

export type MyBookingItem = HostBookingItem & {
  id: number;
  can_review: boolean;
  review: MyReview | null;
};

export type MyBooking = {
  id: number;
  status: BookingStatus;
  headcount: number;
  start_date: string;
  end_date: string;
  total_price: number;
  requested_at: string;
  decided_at: string | null;
  village_id: number;
  village_name: string | null;
  discount_amount: number;
  items: MyBookingItem[];
};

export async function fetchMyBookings(token: string) {
  const { data } = await api.get<MyBooking[]>('/api/bookings/mine', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

export async function cancelMyBooking(token: string, bookingId: number) {
  const { data } = await api.post<MyBooking>(
    `/api/bookings/${bookingId}/cancel`,
    null,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return data;
}

export async function createReview(
  token: string,
  payload: { booking_item_id: number; rating: number; comment: string },
) {
  const { data } = await api.post<MyReview>('/api/reviews/', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

export async function updateReview(
  token: string,
  reviewId: number,
  payload: { rating: number; comment: string },
) {
  const { data } = await api.patch<MyReview>(
    `/api/reviews/${reviewId}`,
    payload,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return data;
}

export async function deleteReview(token: string, reviewId: number) {
  await api.delete(`/api/reviews/${reviewId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export type Review = {
  id: number;
  author: string;
  rating: number;
  comment: string;
  created_date: string;
};

export type ReviewList = {
  count: number;
  average_rating: number | null;
  reviews: Review[];
};

export async function fetchReviews(
  target: { experienceId: number } | { lodgingId: number },
) {
  const { data } = await api.get<ReviewList>('/api/reviews/', {
    params:
      'experienceId' in target
        ? { experience_id: target.experienceId }
        : { lodging_id: target.lodgingId },
  });
  return data;
}

export async function fetchHostBookings(token: string) {
  const { data } = await api.get<HostBooking[]>('/api/bookings/host', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}

export async function decideHostBooking(
  token: string,
  bookingId: number,
  decision: 'approve' | 'reject',
) {
  const { data } = await api.post<HostBooking>(
    `/api/bookings/host/${bookingId}/${decision}`,
    null,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return data;
}

export async function getVillageDetail(villageId: number) {
  const { data } = await api.get<VillageDetail>(
    `/api/villages/${villageId}/detail`,
  );
  return data;
}
