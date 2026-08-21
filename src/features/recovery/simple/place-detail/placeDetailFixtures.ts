import { recommendations, type Recommendation } from "../recommendation-data";

interface GalleryImage {
  src: string;
  alt: string;
}

interface RecommendationReason {
  category: string;
  title: string;
  description: string;
}

interface PlaceDetailSupplement {
  gallery: GalleryImage[];
  recommendationReason: RecommendationReason;
  description: string;
  tags: string[];
  address: string;
  closedDay: string;
  nextPlace: string;
  nextTravelTime: string;
  facilities: string[];
}

export interface PlaceDetailFixture
  extends Recommendation, PlaceDetailSupplement {}

const sharedGalleryImages: GalleryImage[] = [
  {
    src: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=84",
    alt: "컬러 미디어 아트 전시",
  },
  {
    src: "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=900&q=84",
    alt: "현대 미술 전시 공간",
  },
  {
    src: "https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=900&q=84",
    alt: "빛을 활용한 디지털 아트",
  },
  {
    src: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=900&q=84",
    alt: "넓은 실내 갤러리",
  },
];

const PLACE_DETAIL_SUPPLEMENTS: Record<string, PlaceDetailSupplement> = {
  "arte-museum": {
    gallery: sharedGalleryImages,
    recommendationReason: {
      category: "날씨 · 일정",
      title: "비 오는 날에도 현재 일정에 맞춰 방문하기 좋아요",
      description:
        "실내 중심의 미디어 아트 공간이라 날씨의 영향을 거의 받지 않고, 다음 일정인 경포해변까지 이동한 뒤에도 25분의 여유가 남아 일정을 자연스럽게 이어갈 수 있어요.",
    },
    description:
      "아르떼뮤지엄 강릉은 디지털 기술과 자연을 결합한 몰입형 미디어 아트 전시 공간입니다. 파도와 숲, 별빛을 모티프로 한 작품을 오감으로 경험할 수 있어요. 실내 관광지이기 때문에 날씨에 영향을 받지 않고 방문할 수 있으며 약 1~2시간 정도 관람하기 좋습니다.",
    tags: ["몰입형 전시", "실내 데이트", "가족 여행", "포토 스팟"],
    address: "강원특별자치도 강릉시 난설헌로 131",
    closedDay: "연중무휴",
    nextPlace: "경포해변",
    nextTravelTime: "18분",
    facilities: ["주차 가능", "화장실", "실내 관광지", "휠체어 접근 가능"],
  },
  haslla: {
    gallery: sharedGalleryImages,
    recommendationReason: {
      category: "날씨 · 전시",
      title: "비 오는 오후에도 예술 작품을 여유롭게 즐길 수 있어요",
      description:
        "실내 미술관과 조각 전시를 함께 둘러볼 수 있고, 다음 일정으로 이동하기 전까지 15분의 여유가 남아 일정 변경 부담이 적어요.",
    },
    description:
      "하슬라아트월드는 동해를 바라보는 복합 예술 공간으로 현대미술관과 조각공원을 함께 운영합니다. 실내 전시 비중이 높아 비가 오는 날에도 작품을 중심으로 여유롭게 관람하기 좋습니다.",
    tags: ["현대 미술", "실내 전시", "조각 작품", "오션 뷰"],
    address: "강원특별자치도 강릉시 강동면 율곡로 1441",
    closedDay: "연중무휴",
    nextPlace: "경포해변",
    nextTravelTime: "32분",
    facilities: ["주차 가능", "화장실", "실내 관광지", "카페"],
  },
  ojukheon: {
    gallery: sharedGalleryImages,
    recommendationReason: {
      category: "이동 · 일정",
      title: "짧은 이동으로 역사 문화 일정을 이어가기 좋아요",
      description:
        "현재 위치에서 차량으로 12분이면 도착하고 실내 박물관 관람 비중이 높아, 날씨 영향을 줄이면서 다음 일정 전 35분의 여유를 확보할 수 있어요.",
    },
    description:
      "오죽헌은 신사임당과 율곡 이이가 태어난 역사 유적이며 시립박물관을 함께 둘러볼 수 있는 문화 공간입니다. 전통 건축과 실내 전시를 한 번에 경험할 수 있어 짧은 일정에도 알차게 관람하기 좋습니다.",
    tags: ["역사 문화", "실내 박물관", "전통 건축", "가족 여행"],
    address: "강원특별자치도 강릉시 율곡로3139번길 24",
    closedDay: "연중무휴",
    nextPlace: "경포해변",
    nextTravelTime: "14분",
    facilities: ["무료 주차", "화장실", "문화 해설", "휠체어 접근 가능"],
  },
  chamsori: {
    gallery: sharedGalleryImages,
    recommendationReason: {
      category: "거리 · 날씨",
      title: "가까운 실내 박물관이라 일정 변화가 가장 적어요",
      description:
        "현재 위치에서 차량으로 8분이면 도착하며 실내 관람 동선이 잘 갖춰져 있어, 비를 피하면서도 다음 일정 전 40분의 여유를 남길 수 있어요.",
    },
    description:
      "참소리축음기·에디슨과학박물관은 축음기와 과학 발명품을 주제로 한 전문 박물관입니다. 다양한 소리와 과학 자료를 실내에서 관람할 수 있어 날씨와 관계없이 방문하기 좋습니다.",
    tags: ["전문 박물관", "실내 관람", "과학 체험", "가족 여행"],
    address: "강원특별자치도 강릉시 경포로 393",
    closedDay: "연중무휴",
    nextPlace: "경포해변",
    nextTravelTime: "7분",
    facilities: ["주차 가능", "화장실", "실내 관광지", "유아 동반"],
  },
};

export const PLACE_DETAIL_IDS = Object.keys(PLACE_DETAIL_SUPPLEMENTS);

export function getPlaceDetailFixture(
  placeId: string,
): PlaceDetailFixture | undefined {
  const recommendation = recommendations.find(({ id }) => id === placeId);
  const supplement = PLACE_DETAIL_SUPPLEMENTS[placeId];

  if (!recommendation || !supplement) return undefined;

  return { ...recommendation, ...supplement };
}
