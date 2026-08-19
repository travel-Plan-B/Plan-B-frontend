export type RecommendationSort = "recommended" | "rating" | "reviews";

export interface ScheduleChange {
  previous: {
    title: string;
    description: string;
    time: string;
    location: string;
    duration: string;
  };
  recommended: {
    title: string;
    description: string;
    time: string;
    location: string;
    duration: string;
  };
}

export type RecoveryConditionType = "target" | "weather" | "travelTime";

export interface RecoveryCondition {
  type: RecoveryConditionType;
  label: string;
}

export interface Recommendation {
  id: string;
  imageUrl: string;
  imageAlt: string;
  statusLabel: string;
  title: string;
  category: string;
  location: string;
  reason: string;
  arrivalTime: string;
  timeRange: string;
  stayTime: string;
  bufferTime: string;
  travelTime: string;
  cost: string;
  hours: string;
  parking: string;
  rating: number;
  reviewCount: number;
  distanceMinutes: number;
}

export const recoveryConditions: RecoveryCondition[] = [
  { type: "target", label: "실내 장소" },
  { type: "weather", label: "비 오는 날" },
  { type: "travelTime", label: "이동 30분 이내" },
];

export const changedSchedule: ScheduleChange = {
  previous: {
    title: "경포해변",
    description: "탁 트인 바다를 따라 걷는 야외 일정",
    time: "14:00 - 16:00",
    location: "강릉 안현동",
    duration: "약 2시간",
  },
  recommended: {
    title: "아르떼뮤지엄 강릉",
    description: "날씨와 관계없이 즐기는 미디어아트 전시",
    time: "14:00 - 15:30",
    location: "강릉 초당동",
    duration: "약 1시간 30분",
  },
};

export const INITIAL_RECOMMENDATION_ID = "arte-museum";

export const recommendations: Recommendation[] = [
  {
    id: INITIAL_RECOMMENDATION_ID,
    imageUrl:
      "https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=1400&q=85",
    imageAlt: "빛으로 채워진 미디어아트 전시 공간",
    statusLabel: "추천 일정",
    title: "아르떼뮤지엄 강릉",
    category: "미디어아트 전시",
    location: "강원 강릉시",
    reason:
      "비가 와도 쾌적하게 즐길 수 있는 실내 공간이에요. 기존 일정과 이동 시간이 비슷하고, 여유로운 오후 일정에 잘 맞아요.",
    arrivalTime: "14:00",
    timeRange: "14:00 - 15:30",
    stayTime: "약 1시간 30분",
    bufferTime: "약 25분",
    travelTime: "차량 18분",
    cost: "성인 17,000원",
    hours: "10:00 - 20:00",
    parking: "전용 주차장 이용 가능",
    rating: 4.8,
    reviewCount: 3620,
    distanceMinutes: 18,
  },
  {
    id: "haslla",
    imageUrl:
      "https://images.unsplash.com/photo-1564399579883-451a5d44ec08?auto=format&fit=crop&w=900&q=80&sat=-20",
    title: "하슬라아트월드",
    imageAlt: "하슬라아트월드 전시 공간",
    statusLabel: "추천 일정",
    category: "미술관",
    location: "강릉 강동면",
    travelTime: "차량 26분",
    cost: "성인 15,000원",
    reason:
      "실내 전시와 조각 작품을 함께 감상할 수 있어 비 오는 오후에도 여유롭게 머물기 좋아요.",
    arrivalTime: "14:10",
    timeRange: "14:10 - 16:10",
    stayTime: "약 2시간",
    bufferTime: "약 15분",
    hours: "09:00 - 18:00",
    parking: "전용 주차장 이용 가능",
    rating: 4.3,
    reviewCount: 1920,
    distanceMinutes: 26,
  },
  {
    id: "ojukheon",
    imageUrl:
      "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=900&q=80",
    title: "오죽헌·시립박물관",
    imageAlt: "오죽헌과 시립박물관 전경",
    statusLabel: "추천 일정",
    category: "역사 문화",
    location: "강릉 죽헌동",
    travelTime: "차량 12분",
    cost: "성인 3,000원",
    reason:
      "실내 박물관 관람 비중이 높고 이동 거리가 짧아 변경된 일정에도 부담 없이 연결할 수 있어요.",
    arrivalTime: "13:55",
    timeRange: "13:55 - 15:15",
    stayTime: "약 1시간 20분",
    bufferTime: "약 35분",
    hours: "09:00 - 18:00",
    parking: "무료 주차 가능",
    rating: 4.7,
    reviewCount: 1254,
    distanceMinutes: 12,
  },
  {
    id: "chamsori",
    imageUrl:
      "https://images.unsplash.com/photo-1564399579883-451a5d44ec08?auto=format&fit=crop&w=900&q=80",
    title: "참소리축음기 에디슨과학박물관",
    imageAlt: "참소리축음기 에디슨과학박물관 전시실",
    statusLabel: "추천 일정",
    category: "박물관",
    location: "강릉 저동",
    travelTime: "차량 8분",
    cost: "성인 15,000원",
    reason:
      "현재 위치에서 가장 가깝고 실내 관람 동선이 잘 갖춰져 있어 날씨 영향을 거의 받지 않아요.",
    arrivalTime: "13:50",
    timeRange: "13:50 - 15:20",
    stayTime: "약 1시간 30분",
    bufferTime: "약 40분",
    hours: "09:00 - 17:00",
    parking: "전용 주차장 이용 가능",
    rating: 4.4,
    reviewCount: 2841,
    distanceMinutes: 8,
  },
];
